/**
 * remove an item from an array at the specified index and return a new array
 * @template T The type of elements in the array.
 * @param array The array to remove an item from.
 * @param index The index of the item to remove.
 * @returns A new array with the item removed.
 */
export const removeArrayItemAtIndex = <T>(array: T[], index: number): T[] => [
  ...array.slice(0, index),
  ...array.slice(index + 1)
];

/**
 * replace an item from an array at the specified index and return a new array
 * @template T The type of elements in the array.
 * @param array The array to replace an item in.
 * @param replacement The item to insert.
 * @param index The index at which to replace the item.
 * @returns A new array with the item replaced.
 */
export const replaceArrayItemAtIndex = <T>(array: T[], replacement: T, index: number): T[] => [
  ...array.slice(0, index),
  replacement,
  ...array.slice(index + 1)
];

/**
 * add an item to an array at the specified index and return a new array
 * @template T The type of elements in the array.
 * @param array The array to add an item to.
 * @param item The item to add.
 * @param index The index at which to add the item.
 * @returns A new array with the item added.
 */
export const addArrayItemAtIndex = <T>(array: T[], item: T, index: number): T[] => [
  ...array.slice(0, index),
  item,
  ...array.slice(index)
];

/**
 * map and filter an array at the same time, thus reducing iterations
 * @template T The type of elements in the input array.
 * @template U The type of elements in the output array.
 * @param array The array to filter and map.
 * @param filter A function that returns true if the item should be included.
 * @param map A function that transforms the item.
 * @returns A new array containing the filtered and mapped items.
 */
export const arrayFilterAndMap = <T, U>(
  array: T[],
  filter: (input: T) => boolean,
  map: (input: T) => U
): U[] => array.reduce((result: U[], current: T) => {
  if (filter(current)) {
    result.push(map(current));
  }

  return result;
}, []); // Initialize with an empty array of type U[]

/**
 * get all the unique values into a new array
 * @template T The type of elements in the array.
 * @param array The array to find unique values from.
 * @param uniqueByFn Optional function to generate a string representation for uniqueness comparison.
 * @returns A new array with unique values.
 */
export const unique = <T>(array: T[], uniqueByFn?: (input: T) => string): T[] => {
  const newArray: T[] = [];

  // Use Record<string, boolean> for better type safety than {}
  const map: Record<string, boolean> = {};

  for (let i = 0; i < array.length; i += 1) {
    const currentItem = array[i];

    // Use currentItem directly if uniqueByFn is not provided, handle non-string case later
    let stringValue: string | T = uniqueByFn ? uniqueByFn(currentItem) : currentItem;

    // Attempt to stringify only if it's not already a string
    if (typeof stringValue !== 'string') {
      try {
        // Handle potential non-serializable values gracefully
        stringValue = JSON.stringify(stringValue);
      } catch (e) {
        // If stringification fails, we might need a different strategy or accept potential duplicates
        // For now, let's try a simple toString() as a fallback, though it might not be unique
        console.warn("Could not stringify object for uniqueness check, using toString()", e);
        stringValue = String(stringValue);
      }
    }

    // Ensure stringValue is definitely a string after potential stringification/fallback
    if (typeof stringValue !== 'string') {
       // This case should ideally not be reached if stringification or String() works
       // If it does, it indicates a complex object that couldn't be represented as a unique string easily.
       // Consider throwing an error or logging a more severe warning.
       console.error("Failed to create a unique string key for item:", currentItem);

       // Skip this item or handle as needed
       continue;
    }

    if (!map[stringValue]) {
      newArray.push(currentItem);
      map[stringValue] = true;
    }
  }

  return newArray;
};

/**
 * update an array item with a matching value using a modification function
 * @template T The type of elements in the array.
 * @param array The array to modify.
 * @param keyNameOrMatcher A property name (string) or a function that returns true for the item to modify.
 * @param valueOrModifier The value to match against (if keyName is string), or the modification function (if keyName is function or 4th arg is omitted).
 * @param modificationFunction Optional modification function (if keyName is string and value is provided).
 * @returns A new array with the modified item.
 */
export const modifyArrayItemAt = <T>(
  array: T[],
  keyNameOrMatcher: keyof T | string | ((input: T) => boolean), // Use keyof T for better safety if T is an object
  valueOrModifier: unknown | ((input: T) => T),
  modificationFunction?: (input: T) => T
): T[] => {
  const modifier = typeof modificationFunction === 'function' ? modificationFunction :
                   typeof valueOrModifier === 'function' ? valueOrModifier :
                   undefined;

  if (typeof modifier !== 'function') {
    throw new Error('You must pass a modification function as the 3rd or 4th argument');
  }

  return array.map(element => {
    const isFunctionMatch = typeof keyNameOrMatcher === 'function' && keyNameOrMatcher(element);

    // Type assertion needed here as element[keyNameOrMatcher] is not safe without more constraints
    const isValueMatch = typeof keyNameOrMatcher === 'string' && (element as never)[keyNameOrMatcher] === valueOrModifier;

    if (isFunctionMatch || isValueMatch) {
      // Note: Spreading arrays/objects might not be the desired behavior if T is a primitive.
      // This assumes T is usually an object or array when modification happens.
      // Consider refining based on expected usage.
      // if (Array.isArray(element)) {
      //   return [...modifier(element as any)] as T; // Need assertions here
      // }
      // if (typeof element === 'object' && element !== null) {
      //   return { ...modifier(element) };
      // }
      return modifier(element); // Simpler approach: let modifier return the new value
    }

    return element;
  });
};

/**
 * remove an array item with a matching value
 * @template T The type of elements in the array.
 * @param array The array to remove items from.
 * @param keyNameOrValue A property name (string) to match against `value`, or the value itself to remove if `value` is undefined.
 * @param value The value to match if `keyNameOrValue` is a string property name.
 * @returns A new array with matching items removed.
 */
export const removeArrayItemAt = <T>(
  array: T[],
  keyNameOrValue: keyof T | string | T,
  value?: unknown
): T[] => array.filter(element => {
  // Case 1: Remove by direct value comparison (value is undefined)
  if (value === undefined) {
    return element !== keyNameOrValue;
  }

  // Case 2: Remove by matching property value (keyNameOrValue is a string key)
  // Type assertion needed for dynamic property access
  if (typeof keyNameOrValue === 'string' && typeof element === 'object' && element !== null && (element as never)[keyNameOrValue] === value) {
    return false;
  }

  // Default: Keep the element
  return true;
});

/**
 * replace an array item with a matching value
 * @template T The type of elements in the array.
 * @param array The array to replace items in.
 * @param keyName The property name to match against `value`.
 * @param value The value to match.
 * @param newItem The new item to replace the matched item with.
 * @returns A new array with matching items replaced.
 */
export const replaceArrayItemAt = <T>(
  array: T[],
  keyName: keyof T | string,
  value: unknown,
  newItem: T
): T[] => array.map((element: T) => {
  // Type assertion needed for dynamic property access
  if (typeof element === 'object' && element !== null && (element as never)[keyName] === value) {
    return newItem;
  }

  return element;
});

// --- get and set ---
// These are inherently difficult to type strongly due to dynamic paths.
// Using 'unknown' and type guards/assertions in the calling code is often necessary.
// We can add some basic generics but full type safety is challenging.

type PathSegment = string | number;
type Path = PathSegment | PathSegment[];

/**
 * get a value from an object or array at a specified path
 * @param input The object or array to retrieve from.
 * @param path The path string (e.g., 'a.b[0].c') or array of segments.
 * @param defaultValue The value to return if the path doesn't exist.
 * @param shouldThrow If true, throw an error instead of returning defaultValue.
 * @param allowFalsyValues If false, return defaultValue if the resolved value is falsy.
 * @returns The value found at the path, or the defaultValue.
 */
export const get = <T = unknown>( // Default generic to unknown
  input: never, // Input can be anything, hard to type strongly
  path: Path | ((input: never) => T),
  defaultValue: T | null = null,
  shouldThrow = false,
  allowFalsyValues = true
): T | null => {
  if (typeof path === 'function') {
    // If path is a function, assume it returns the correct type T
    try {
      const result = path(input);

      // Check for falsy if needed
      if (!allowFalsyValues && !result) {
        return defaultValue;
      }

      return result;
    } catch (e) {
       if (shouldThrow) {
         throw new Error(`Function path failed: ${(e as Error).message}`);
       }

       return defaultValue;
    }
  }

  let currentPath: PathSegment[];

  if (typeof path === 'string') {
    // Basic parsing, might need refinement for complex cases like 'a.b[0][1].c'
    currentPath = path.split(/[.[\]]+/).filter(Boolean);
  } else {
    currentPath = [...path]; // Clone array
  }

  if (currentPath.length === 0) {
    // Check for falsy if needed
    if (!allowFalsyValues && !input) {
        return defaultValue;
    }

    return input as T ?? defaultValue; // Use nullish coalescing
  }

  let currentVal: never = input;

  for (let i = 0; i < currentPath.length; i++) {
      const key = currentPath[i];

      // Check if currentVal is indexable before accessing
      if (currentVal === null || currentVal === undefined) {
          if (shouldThrow) {
              throw new Error(`Cannot access key "${key}" on null or undefined at path segment ${i}`);
          }

          return defaultValue;
      }

      const nextVal = currentVal[key];

      if (nextVal === undefined) {
          if (shouldThrow) {
              throw new Error(`Item at path "${currentPath.slice(0, i + 1).join('.')}" not found.`);
          }

          return defaultValue;
      }

      currentVal = nextVal;
  }

  // Final check for falsy values
  if (!allowFalsyValues && !currentVal) {
    return defaultValue;
  }

  // We can only assume the final type is T
  return currentVal as T ?? defaultValue;
};

/**
 * set an object value at a specific path. Mutates the object.
 * @param obj The object or array to modify.
 * @param path The path string (e.g., 'a.b[0].c') or array of segments.
 * @param val The value to set.
 */
export const set = (obj: never, path: Path, val: unknown): void => {
  // Improved path parsing to handle array indices like [0]
  function stringToPath(stringPath: string | PathSegment[]): PathSegment[] {
    if (Array.isArray(stringPath)) return stringPath;

    if (typeof stringPath !== 'string') return [];

    // Match property names or array indices like [0], [1], etc.
    const pathArray = stringPath.match(/([^[.\]]+)|(\[\d+\])/g);

    if (!pathArray) return [];

    return pathArray.map(segment => {
      // If it's an array index like [0], extract the number
      if (segment.startsWith('[') && segment.endsWith(']')) {
        return parseInt(segment.substring(1, segment.length - 1), 10);
      }

      // Otherwise, it's a property name
      return segment;
    });
  }

  const currentPath = stringToPath(path);
  const { length } = currentPath;
  let current: never = obj;

  for (let i = 0; i < length; i++) {
    const key = currentPath[i];
    const nextKey = currentPath[i + 1];
    const isLast = i === length - 1;

    // Ensure current is an object or array before proceeding
     if (current === null || typeof current !== 'object') {
       console.error(`Cannot set path on non-object at segment ${i} (key: ${key})`);

       return; // Stop mutation if path is invalid
     }

    if (isLast) {
      current[key] = val;
    } else {
      // Determine if the next level should be an array or object
      const shouldBeArray = typeof nextKey === 'number';

      if (current[key] === undefined || current[key] === null) {
        // Create object or array if it doesn't exist
        current[key] = shouldBeArray ? [] : {};
      } else if (shouldBeArray && !Array.isArray(current[key])) {
         // Overwrite if existing structure doesn't match (e.g., object exists where array is needed)
         console.warn(`Overwriting non-array value at path segment ${i} (key: ${key}) with an array.`);
         current[key] = [];
      } else if (!shouldBeArray && (typeof current[key] !== 'object' || Array.isArray(current[key]))) {
         // Overwrite if existing structure doesn't match (e.g., array exists where object is needed)
         console.warn(`Overwriting non-object value at path segment ${i} (key: ${key}) with an object.`);
         current[key] = {};
      }

      current = current[key];
    }
  }
};

/**
 * create a hash map from an array using the value found at a path
 * @template T The type of elements in the input array.
 * @template K The type of the keys in the resulting map (usually string or number).
 * @param inputArray The array to convert into a map.
 * @param path The path to the key value within each element, or null to use the element itself.
 * @param valuesAsArrays If true, map values will be arrays of elements with the same key.
 * @returns A hash map (object).
 */
export function createMap<T>(
  inputArray: T[],
  path: Path | null = null,
  valuesAsArrays = false
): Record<string | number, T | T[]> { // Return type reflects potential array values
  return inputArray.reduce((hashmap: Record<string | number, T | T[]>, element: T) => {
    // Use 'unknown' for keyValue initially as 'get' returns unknown/T|null
    const keyValue: unknown = path
      ? get(element as never, path) // Need 'as any' because 'get' expects 'any' input
      : element;

    // Ensure keyValue is suitable as an object key (string or number)
    if (typeof keyValue !== 'string' && typeof keyValue !== 'number') {
        console.warn("Skipping element in createMap: Key value is not a string or number.", element);

        return hashmap; // Skip if key is not valid
    }

    if (valuesAsArrays) {
      const existing = hashmap[keyValue] as T[] | undefined; // Assert or check type

      return { ...hashmap, [keyValue]: [...(existing || []), element] };
    } else {
      if (hashmap[keyValue] !== undefined) {
          console.warn(`Duplicate key "${keyValue}" encountered in createMap. Overwriting previous value.`);
      }

      return { ...hashmap, [keyValue]: element };
    }
  }, {}); // Initialize with an empty object
}

/**
 * subtracts the items in one array from another array, returning a new array
 * @template T The type of elements in the arrays.
 * @param arr1 The array to subtract from.
 * @param arr2 The array containing items to subtract.
 * @returns A new array containing items from arr1 that are not in arr2.
 */
export function subtractArrays<T>(arr1: T[], arr2: T[]): T[] {
  // For better performance with large arrays, consider using a Set for arr2
  const arr2Set = new Set(arr2);

  return arr1.filter(item => !arr2Set.has(item));
}

/**
 * curried sort callback to sort alphanumerically by a specific key or the element itself
 * @template T The type of elements in the array.
 * @param key Optional path to the value to sort by within each element.
 * @returns A comparison function for Array.prototype.sort().
 */
export function sortAlphaNumeric<T>(key: Path | null = null) {
  return (a: T, b: T): number => {
    const isNumber = (v: string): boolean => (+v).toString() === v;

    // Use 'unknown' as 'get' returns unknown/T|null
    const aValueUnknown = key ? get(a as never, key) : a;
    const bValueUnknown = key ? get(b as never, key) : b;

    // Convert potentially non-string values to strings for comparison
    const aValue = String(aValueUnknown ?? ''); // Use nullish coalescing and String()
    const bValue = String(bValueUnknown ?? '');

    // Regex to split into sequences of digits or non-digits
    const aPart = aValue.match(/\d+|\D+/g) || [];
    const bPart = bValue.match(/\d+|\D+/g) || [];

    let i = 0;
    const len = Math.min(aPart.length, bPart.length);

    while (i < len && aPart[i] === bPart[i]) { i += 1; }

    // If one is a prefix of the other, shorter comes first
    if (i === len) {
      return aPart.length - bPart.length;
    }

    const aSegment = aPart[i];
    const bSegment = bPart[i];

    // If both segments are numbers, compare numerically
    if (isNumber(aSegment) && isNumber(bSegment)) {
      return parseInt(aSegment, 10) - parseInt(bSegment, 10);
    }

    // Otherwise, compare lexicographically
    return aSegment.localeCompare(bSegment);
  };
}

/**
 * Slice an array into chunks of a specific size
 * @template T The type of elements in the array.
 * @param array The array to chunk.
 * @param size The desired size of each chunk.
 * @returns An array of arrays (chunks).
 */
export function chunkArray<T>(array: T[], size: number): T[][] {
  if (size <= 0) {
      // Return a single chunk containing the whole array or an empty array if size is invalid
      return array.length > 0 ? [array] : [];
  }

  const res: T[][] = [];

  for (let i = 0; i < array.length; i += size) {
    const chunk = array.slice(i, i + size);

    res.push(chunk);
  }

  return res;
}

// Remove the empty default export if not needed, or export specific functions if preferred
// export default {};
