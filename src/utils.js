/**
 * 深度拷贝
 * @param {*} obj
 * @returns
 */
export const cloneDeep = (obj) => {
  if (Object.prototype.toString.call(obj) === "[object Array]") {
    return obj.map(cloneDeep);
  }
  if (Object.prototype.toString.call(obj) === "[object Object]") {
    return Object.keys(obj).reduce((acc, key) => {
      acc[key] = cloneDeep(obj[key]);
      return acc;
    }, {});
  }
  return obj;
};
