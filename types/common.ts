

export type ElTagType = 'primary' | 'success' | 'info' | 'warning' | 'danger';

export interface DictDataVO {
    dictCode?: string;
    dictLabel: string;
    dictValue: string;
    cssClass?: string;
    listClass?: ElTagType;
    dictSort?: number;
    remark?: string;
}

export interface DictDataOption {
    label: string;
    value: string;
    elTagType?: ElTagType;
    elTagClass?: string;
}