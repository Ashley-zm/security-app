package com.example.aidetect;

import android.Manifest;
import android.app.Activity;
import android.content.pm.PackageManager;
import android.os.Build;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.util.Log;
import android.util.Size;
import android.view.Gravity;
import android.view.ViewGroup;
import android.widget.Button;
import android.widget.FrameLayout;
import android.widget.LinearLayout;
import android.widget.TextView;

import androidx.annotation.NonNull;
import androidx.camera.core.CameraSelector;
import androidx.camera.core.ImageAnalysis;
import androidx.camera.core.ImageProxy;
import androidx.camera.core.Preview;
import androidx.camera.lifecycle.ProcessCameraProvider;
import androidx.camera.view.PreviewView;
import androidx.lifecycle.Lifecycle;
import androidx.lifecycle.LifecycleOwner;
import androidx.lifecycle.LifecycleRegistry;

import com.google.common.util.concurrent.ListenableFuture;

import java.util.concurrent.Executor;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

public class DetectActivity extends Activity implements LifecycleOwner {

    private static final String TAG = "AiDetectPlugin";
    private static final int REQUEST_CAMERA_PERMISSION = 1001;

    private final LifecycleRegistry lifecycleRegistry = new LifecycleRegistry(this);
    private final Handler mainHandler = new Handler(Looper.getMainLooper());
    private final Executor mainExecutor = mainHandler::post;
    private final ExecutorService analysisExecutor = Executors.newSingleThreadExecutor();

    private PreviewView cameraPreview;
    private TextView statusText;
    private ListenableFuture<ProcessCameraProvider> cameraProviderFuture;
    private ProcessCameraProvider cameraProvider;
    private ImageAnalysis imageAnalysis;
    private long lastAnalyzeTimeMs = 0L;
    private int analyzedFrameCount = 0;
    private String currentStatus = "";

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        Log.e(TAG, "DetectActivity onCreate");
        lifecycleRegistry.handleLifecycleEvent(Lifecycle.Event.ON_CREATE);
        setTitle("AI检测页面");
        setContentView(createContentView());
        updateStatus("正在检查相机权限");
        ensureCameraPermission();
    }

    @Override
    protected void onStart() {
        super.onStart();
        Log.e(TAG, "DetectActivity onStart");
        lifecycleRegistry.handleLifecycleEvent(Lifecycle.Event.ON_START);
    }

    @Override
    protected void onResume() {
        super.onResume();
        Log.e(TAG, "DetectActivity onResume");
        lifecycleRegistry.handleLifecycleEvent(Lifecycle.Event.ON_RESUME);
    }

    @Override
    protected void onPause() {
        Log.e(TAG, "DetectActivity onPause");
        lifecycleRegistry.handleLifecycleEvent(Lifecycle.Event.ON_PAUSE);
        super.onPause();
    }

    @Override
    protected void onStop() {
        Log.e(TAG, "DetectActivity onStop");
        lifecycleRegistry.handleLifecycleEvent(Lifecycle.Event.ON_STOP);
        super.onStop();
    }

    @Override
    protected void onDestroy() {
        Log.e(TAG, "DetectActivity onDestroy");
        releaseCamera();
        analysisExecutor.shutdownNow();
        DetectConfig.clearCallback();
        lifecycleRegistry.handleLifecycleEvent(Lifecycle.Event.ON_DESTROY);
        super.onDestroy();
    }

    @NonNull
    @Override
    public Lifecycle getLifecycle() {
        return lifecycleRegistry;
    }

    private FrameLayout createContentView() {
        FrameLayout root = new FrameLayout(this);
        root.setBackgroundColor(0xFF000000);

        cameraPreview = new PreviewView(this);
        cameraPreview.setImplementationMode(PreviewView.ImplementationMode.COMPATIBLE);
        cameraPreview.setScaleType(PreviewView.ScaleType.FILL_CENTER);
        root.addView(cameraPreview, new FrameLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                ViewGroup.LayoutParams.MATCH_PARENT
        ));

        LinearLayout bottomBar = new LinearLayout(this);
        bottomBar.setOrientation(LinearLayout.HORIZONTAL);
        bottomBar.setGravity(Gravity.CENTER_VERTICAL);
        bottomBar.setPadding(dp(16), dp(12), dp(16), dp(12));
        bottomBar.setBackgroundColor(0xCC111827);

        statusText = new TextView(this);
        statusText.setTextColor(0xFFFFFFFF);
        statusText.setTextSize(15);
        statusText.setSingleLine(false);
        LinearLayout.LayoutParams statusParams = new LinearLayout.LayoutParams(
                0,
                ViewGroup.LayoutParams.WRAP_CONTENT,
                1F
        );
        bottomBar.addView(statusText, statusParams);

        Button stopButton = new Button(this);
        stopButton.setText("停止检测");
        stopButton.setAllCaps(false);
        stopButton.setOnClickListener(v -> finish());
        LinearLayout.LayoutParams buttonParams = new LinearLayout.LayoutParams(
                dp(112),
                dp(44)
        );
        buttonParams.leftMargin = dp(12);
        bottomBar.addView(stopButton, buttonParams);

        FrameLayout.LayoutParams bottomParams = new FrameLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                ViewGroup.LayoutParams.WRAP_CONTENT,
                Gravity.BOTTOM
        );
        root.addView(bottomBar, bottomParams);

        return root;
    }

    private void ensureCameraPermission() {
        Log.e(TAG, "ensureCameraPermission");
        if (hasCameraPermission()) {
            Log.e(TAG, "camera permission already granted");
            startCameraPreview();
            return;
        }

        Log.e(TAG, "camera permission missing, request permission");
        updateStatus("需要相机权限");
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            requestPermissions(new String[]{Manifest.permission.CAMERA}, REQUEST_CAMERA_PERMISSION);
        } else {
            handleCameraPermissionDenied();
        }
    }

    private boolean hasCameraPermission() {
        boolean granted;
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.M) {
            granted = checkCallingOrSelfPermission(Manifest.permission.CAMERA) == PackageManager.PERMISSION_GRANTED;
        } else {
            granted = checkSelfPermission(Manifest.permission.CAMERA) == PackageManager.PERMISSION_GRANTED;
        }
        Log.e(TAG, "hasCameraPermission=" + granted);
        return granted;
    }

    @Override
    public void onRequestPermissionsResult(int requestCode, @NonNull String[] permissions, @NonNull int[] grantResults) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults);
        if (requestCode != REQUEST_CAMERA_PERMISSION) {
            return;
        }

        Log.e(TAG, "onRequestPermissionsResult, grantResults.length=" + grantResults.length);
        if (grantResults.length > 0 && grantResults[0] == PackageManager.PERMISSION_GRANTED) {
            startCameraPreview();
        } else {
            handleCameraPermissionDenied();
        }
    }

    private void startCameraPreview() {
        Log.e(TAG, "startCameraPreview");
        updateStatus("正在启动后置摄像头");
        DetectConfig.notifyCallback(true, "camera_permission_granted", "相机权限已授予");

        cameraProviderFuture = ProcessCameraProvider.getInstance(this);
        Log.e(TAG, "ProcessCameraProvider future created");
        cameraProviderFuture.addListener(() -> {
            try {
                Log.e(TAG, "CameraProvider listener called");
                cameraProvider = cameraProviderFuture.get();
                Log.e(TAG, "CameraProvider acquired");

                Preview preview = new Preview.Builder().build();
                preview.setSurfaceProvider(cameraPreview.getSurfaceProvider());

                CameraSelector cameraSelector = CameraSelector.DEFAULT_BACK_CAMERA;

                cameraProvider.unbindAll();
                Log.e(TAG, "CameraProvider unbindAll done");
                cameraProvider.bindToLifecycle(this, cameraSelector, preview);
                Log.e(TAG, "Preview bindToLifecycle success");
                boolean analysisStarted = startImageAnalysis(cameraSelector);
                Log.e(TAG, "ImageAnalysis started=" + analysisStarted);
                if (analysisStarted) {

                updateStatus("后置摄像头预览中，ImageAnalysis 已启动");
                DetectConfig.notifyCallback(true, "camera_preview_started", "CameraX 后置摄像头预览和 ImageAnalysis 已启动");
                } else {
                    updateStatus("后置摄像头预览中，ImageAnalysis 启动失败");
                    DetectConfig.notifyCallback(true, "camera_preview_started", "CameraX 后置摄像头预览已启动，ImageAnalysis 启动失败");
                }
            } catch (Throwable throwable) {
                Log.e(TAG, "CameraX preview start failed", throwable);
                updateStatus("摄像头启动失败：" + throwable.getClass().getSimpleName());
                DetectConfig.notifyCallback(false, "camera_preview_failed", throwable.toString());
            }
        }, mainExecutor);
    }

    private void handleCameraPermissionDenied() {
        Log.e(TAG, "handleCameraPermissionDenied");
        updateStatus("相机权限被拒绝");
        DetectConfig.notifyCallback(false, "camera_permission_denied", "相机权限被拒绝，无法启动预览");
    }

    private boolean startImageAnalysis(@NonNull CameraSelector cameraSelector) {
        try {
            Log.e(TAG, "startImageAnalysis");
            imageAnalysis = new ImageAnalysis.Builder()
                    .setTargetResolution(new Size(640, 480))
                    .setBackpressureStrategy(ImageAnalysis.STRATEGY_KEEP_ONLY_LATEST)
                    .build();
            imageAnalysis.setAnalyzer(analysisExecutor, this::analyzeFrame);
            Log.e(TAG, "ImageAnalysis analyzer set");
            cameraProvider.bindToLifecycle(this, cameraSelector, imageAnalysis);
            Log.e(TAG, "ImageAnalysis bindToLifecycle success");
            return true;
        } catch (Throwable throwable) {
            imageAnalysis = null;
            Log.e(TAG, "ImageAnalysis start failed, keep preview only", throwable);
            updateStatus("后置摄像头预览中，ImageAnalysis 启动失败");
            DetectConfig.notifyCallback(false, "image_analysis_failed", throwable.toString());
            return false;
        }
    }

    private void analyzeFrame(@NonNull ImageProxy imageProxy) {
        try {
            int width = imageProxy.getWidth();
            int height = imageProxy.getHeight();
            int rotationDegrees = imageProxy.getImageInfo().getRotationDegrees();
            int format = imageProxy.getFormat();

            Log.i(TAG, "ImageAnalysis frame received"
                    + ", width=" + width
                    + ", height=" + height
                    + ", rotationDegrees=" + rotationDegrees
                    + ", format=" + format);

            DetectConfig.Snapshot config = DetectConfig.snapshot();
            long nowMs = System.currentTimeMillis();
            int detectIntervalMs = Math.max(0, config.detectInterval);

            if (lastAnalyzeTimeMs > 0 && nowMs - lastAnalyzeTimeMs < detectIntervalMs) {
                return;
            }
            lastAnalyzeTimeMs = nowMs;

            int frameCount = ++analyzedFrameCount;
            Log.i(TAG, "ImageAnalysis frame analyzed"
                    + ", analyzedFrameCount=" + frameCount
                    + ", detectIntervalMs=" + detectIntervalMs);

            mainHandler.post(() -> updateAnalyzedFrameCount(frameCount));
        } finally {
            imageProxy.close();
        }
    }

    private void updateStatus(String status) {
        currentStatus = status;
        refreshStatusText();
    }

    private void updateAnalyzedFrameCount(int frameCount) {
        analyzedFrameCount = frameCount;
        refreshStatusText();
    }

    private void refreshStatusText() {
        if (statusText != null) {
            statusText.setText(String.format("当前状态：%s\n已分析帧数：%d", currentStatus, analyzedFrameCount));
        }
    }

    private void releaseCamera() {
        if (imageAnalysis != null) {
            imageAnalysis.clearAnalyzer();
            imageAnalysis = null;
        }

        if (cameraProvider != null) {
            cameraProvider.unbindAll();
            cameraProvider = null;
        }

        if (cameraProviderFuture != null && !cameraProviderFuture.isDone()) {
            cameraProviderFuture.cancel(true);
        }
        cameraProviderFuture = null;
    }

    private int dp(int value) {
        return (int) (value * getResources().getDisplayMetrics().density + 0.5F);
    }
}
