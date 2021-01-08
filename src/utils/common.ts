export interface DataObj {
    key: string;
    value: string;
}

export const setLocalStorage = (data: DataObj[]): void => {
    data.forEach((item) => localStorage.setItem(item.key, item.value));
};

export const getLocalStorage = (key: string): string | null => {
    return localStorage.getItem(key);
};

export const setAttribute = (el: string, name: string, value: string): void => {
    document.querySelector(el)?.setAttribute(name, value);
};