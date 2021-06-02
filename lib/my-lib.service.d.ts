import * as i0 from "@angular/core";
export interface DATA<T> {
    timestamp: number;
    value: T;
    sensorId: string;
}
export declare class DataService {
    str: string;
    constructor();
    parse<T>(str: string, sensorId: string, f: (s: string) => T): DATA<T>[];
    static ɵfac: i0.ɵɵFactoryDef<DataService, never>;
    static ɵprov: i0.ɵɵInjectableDef<DataService>;
}
//# sourceMappingURL=my-lib.service.d.ts.map