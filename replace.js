// Minimal React-inspired framework that simplifies node creation.
const { createElement, isStorageSupported } = (() => {
  // filter for properties
  const isEvent = (key) => key.startsWith("on");
  const isProperty = (key) => !isEvent(key);

  // createElement is a React-inspired helper function that creates DOM nodes.
  // In contrast to React, it does not re-render. Global document state is change
  // as a side effect (e.g via event handlers). I can be seen a
  // possible value for tagname:
  //  - existing html tags
  //  - empty tag "<>", will create a document fragment
  //  - empty string, will create a text node
  const createElement = (tagName, props = {}, ...children) => {
    let e;
    switch (tagName) {
      case "<>":
        e = document.createDocumentFragment();
        break;
      case "":
        e = document.createTextNode(props["textContent"] ?? "");
        break;
      default:
        e = document.createElement(tagName);
        break;
    }

    // apply properties, except for fragments
    if (e.nodeType != Node.DOCUMENT_FRAGMENT_NODE) {
      // properties
      Object.keys(props)
        .filter(isProperty)
        .forEach((key) => {
          e[key] = props[key];
        });

      // events
      Object.keys(props)
        .filter(isEvent)
        .forEach((name) => {
          const eventType = name.toLowerCase().substring(2);
          e.addEventListener(eventType, props[name]);
        });
    }

    // append children, except for text nodes
    if (e.nodeType != Node.TEXT_NODE) {
      e.append(...children);
    }

    return e;
  };

  // Checks if the storage provided via the "getStorage" factory
  // can be used (e.g. window.localStorage is no always available).
  const isStorageSupported = (getStorage) => {
    try {
      const key = "__test__";
      getStorage().setItem(key, key);
      getStorage().removeItem(key);
      return true;
    } catch (e) {
      return false;
    }
  };

  return { createElement, isStorageSupported };
})();
