# My Project Docs

This is a small framework for adding mermaid docs to a project.

Please note that you should always change the docs in the `src` folder. **DO NOT** edit `README.md` in the root folder.

Run `npm install` to add dependencies; `npm run build` to build the docs; `npm run serve` for a convenient way to view the docs.

Also convenient, use "Markdown All in One" and "Markdown Preview Mermaid Support" in VS Code.

Mermaid example:

```mermaid
graph LR
	A(Box A) -- Some description --> B(Box B)
	B -- Some more process --> C(Box C)
```