export var DEFAULT_DENOMINATOR = 10000;
export var CurveType;
(function (CurveType) {
    CurveType[CurveType["ConstantProduct"] = 0] = "ConstantProduct";
    CurveType[CurveType["ConstantPrice"] = 1] = "ConstantPrice";
    CurveType[CurveType["Stable"] = 2] = "Stable";
    CurveType[CurveType["ConstantProductWithOffset"] = 3] = "ConstantProductWithOffset";
})(CurveType || (CurveType = {}));
