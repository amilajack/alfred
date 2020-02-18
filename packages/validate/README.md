## @alfred/validate

* Take either a path to a json file or an object
    * If object given, JSON.stringify and format with prettier
* Find the line number of the stringified object
* Add helpful CLI options (provided by jest-validate)
  * Showing inline examples
  * Deprecated properties
* Find out similar spellings of words using levenstine distance or fuzzy search

```
"skillz" property is not found. Did you mean to add the `"skills"`?
```
