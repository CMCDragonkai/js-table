/**
 * O(n) intersection
 * You can use this if you have multiple keys
 * Where you need to look them up together
 */
function intersection<T>(...arrays: Array<Array<T>>): Array<T> {
  let commonSet = new Set(arrays[0]);
  for (let i = 1; i < arrays.length; i++) {
    const set = new Set(arrays[i]);
    commonSet = new Set([...commonSet].filter((item) => set.has(item)));
  }
  return [...commonSet];
}

export { intersection };
