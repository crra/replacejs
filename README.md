# About

> The use of this technique is highly discouraged, but sometimes an option of last resort.

`replace` is a tiny [react](https://reactjs.org/)-inspired `createElement` function (see: [build your own React](https://pomb.us/build-your-own-react/)) implemented in current javascript. Its purpose is to replace existing DOM nodes with newly rendered DOM nodes. It offers no reactivity (re-rendering on change), no hooks, etc.. It can be used to update the DOM on client-side of existing HTML documents that can't be modified (e.g. from an inflexible and outdated document generator that uses [asciidoctor](https://asciidoctor.org/) for each file).

# Usage

> The code serves an explanation purpose and is incomplete by only showing the relevant parts.

Assume there is an existing HTML document that can't be edited on the server before it's sent to the client but the document contains an 'include' (customization) to a javascript file that can changed on the server.

All generated content follows the same structure:

```html
<!DOCTYPE html>
<html>
  ...
  <body>
    <h1>Generated content</h1>
    ...
    <script src="../../../../customization.js" type="text/javascript"></script>
  </body>
</html>
```

In the `customization.js` file

```js
// <<copy the content from replace.js>>
const { createElement, isStorageSupported } = (() => { ...

// Implementation regime:
// - only top-down data flow is allowed
// - like in React, elements are rendered/replaced declaratively and
//   not procedural even if this means re-creating DOM
// - unlike React, updates/side-effects are performed globally on the DOM
//   rather than on the shadow DOM (slow)
//
// Naming conventions:
// - side effect (DOM manipulating) functions are prefixed with "mutate"
// - components start with a capital letter
//

// Register a listener that is fired after the DOM is fully loaded.
// In the original use-case this brought back the flash of unstyled content
// 'https://en.wikipedia.org/wiki/Flash_of_unstyled_content' because every
// page loads a 3MB! javascript file containing key-value pairs for
// an in-memory database.
document.addEventListener("DOMContentLoaded", () => {
  ...
})
```

Inside the listener the mutation of the HTML is performed.

For example moving the asciidoctor copyright notice from the header to the bottom.

```js
// Move the copyright notice to the footer
const target = document.querySelector("#footer-text"),
  element = document.querySelector("#revremark");

if (target && element) {
  // appending an existing node performs a move
  target.append(element);
}
```

This is how `replace` can be used inside the listener to mutate the HTML:

```js
  // The main navigation is used as a target container to append
  // additional "tools" (e.g. navigation, options).
  // Render the navigation by mutating it.
  mutateMainNavigation(
    // Ensures that there is a navigation to mount "tools" into
    mutateMustNavigation(
      document.querySelector("#toc"),
      document.querySelector("#header"),
      document.querySelector("body")
    )
  );
});
```

```js
// Some pages don't have a main navigation, but further "tools"
// depend on it, mutate the DOM and create an empty navigation.
const mutateMustNavigation = (navigation, parent, body) => {
  if (navigation) {
    return navigation;
  }

  // Neither parent or body is available, nothing that can be done
  if (!parent || !body) {
    return;
  }

  // The body needs additional classes
  body.classList.add("toc2", "toc-left");

  // Create an empty navigation and add it to the parent
  return parent.appendChild(
    createElement("div", { id: "toc", className: "toc2" })
  );
};
```

```js
// Mutates/re-renders the main navigation (TOC) and adds additional elements.
const mutateMainNavigation = (navigation, currentPath) => {
  if (!navigation) {
    return;
  }

  // use a shallow clone (with no children) as a container
  const nav = navigation.cloneNode(false);

  /*JSX
  <Navigation>
    <div>
      <DropDown>
        <Button/>
        <DropDownContent>
          <h3>Quick links</h3>
          ...
        </DropDownContent>
      </DropDown>
      <h3>Tools</h3>
      ...
      <ColorSchemeSwitch/>
    </div>
    <previous TOC/>
  </Navigation>
   */
  nav.append(
    createElement(
      "div",
      { id: "search-navigation" },
      DropDownMenu(
        // Anchor element for the dropdown
        Button("≡"),
        // Children
        createElement("h3", { textContent: "Quick links" }),
        LinkList(quickLinks(currentPath), {
          id: "navigation",
          className: "linklist",
        }),
        createElement("h3", { textContent: "Tools" }),
        ColorSchemeSwitch()
      ),
      DocSearch(dbModule.search, dbModule.render)
    ),
    // move all existing children from the current navigation
    ...navigation.childNodes
  );

  // replace current navigation with new
  navigation.replaceWith(nav);
};
```

```js
// Displays a drop down menu with top level placeholder that that expands child elements.
const DropDownMenu = (placeholder, ...children) => {
  return createElement(
    "div",
    { className: "dropdown" },
    placeholder,
    createElement("div", { className: "dropdownContent" }, ...children)
  );
};
```
