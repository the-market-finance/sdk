export interface DataObj {
    key: string;
    value: string;
}
export declare const setLocalStorage: (data: DataObj[]) => void;
export declare const getLocalStorage: (key: string) => string | null;
export declare const setAttribute: (el: string, name: string, value: string) => void;
