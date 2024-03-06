## TypeScript library

Creating a library is like assembling a toolbox of code snippets. These can be shared across multiple apps - whether they're backend-heavy, frontend-centric, or a blend of both. You might want to share a clever string processing script, a custom algorithm, or a unique data structure.

Libraries let you package and share these resources efficiently, reducing repetition and keeping your codebase streamlined. TypeScript is a popular language that encourages writing safe code with great developer experience. In this article, we'll delve into the creation and usage of a TypeScript library within a mono repository.

This setup hosts multiple apps, providing the convenience to develop and locally test libraries in concert with these apps.

## Prerequisites

- Ensure you have node version v18 onwards
- We will use [pnpm ](https://pnpm.io/) package manager. Please have it installed.
- [Visual Studio Code IDE](https://code.visualstudio.com/)

## Create a mono repo using [Turbo build](https://turbo.build/repo/docs/getting-started/create-new) system.

```
npx create-turbo@latest
```

- When prompted give the name to the monorepo. We shall give `test-lib`
- Choose [pnpm](https://pnpm.io/installation) package manager as it has a very good support for linking to libs locally.
- once monorepo is created open it in vs code:

```
cd test-lib
code .
```

## Creating the library using [Vite](https://vitejs.dev/)

We shall use a modern tooling called [Vite](https://vitejs.dev/) to create and setup our library.

- fire up a terminal inside vs code.
- cd into the `packages` folder inside monorepo and run:

```
cd packages
npm create vite@latest
```

- When it prompts for name, give `test-lib`
- and choose `Vanilla` framework,
- and `TypeScript` variant.
- Once you press Enter, you should see the test-lib project created in `packages` folder.

## Examine the vanilla test-lib package created

- `cd test-lib`
- Examine the folder structure
- We have a basic venilla js project.
- first, install dependencies. `pnpm install`
- We can build this package using `pnpm build`, and it will create a built web site in `/dist` folder.
- But we want a library and not the website. For that we need to configure the Vite to convert the package into a library

## Convert the Vanilla project into a library

- First delete files in the `/src` folder except `vite-env.d.ts`
- Delete the public folder as well.
- Create a file called `math.ts` with following content:

```
function add(a: number, b: number): number {
  return a + b;
}

export { add };

```

- Create another file called index.ts and add the following code:

```
export { add } from './math';
```

- Now we need to convert this into a library. Vite supports a [library mode](https://vitejs.dev/guide/build.html#library-mode).
- Create a `vite.config.js` file in the root of `test-lib` package
- Copy the Vite config in the [documentation](https://vitejs.dev/guide/build.html#library-mode) above to our config file. Remove the `rollup` object from it.
- make the lib object to look like so where we have given our library name as TestLib, and file name as test-lib:

```
    lib: {
      // Could also be a dictionary or array of multiple entry points
      entry: resolve(__dirname, 'lib/main.js'),
      name: 'TestLib',
      // the proper extensions will be added
      fileName: 'test-lib',
    },
```

- If you try building now, it will fail complaining the mentioned entry point in config is not found. Lets fix that.

```
entry: resolve(__dirname, 'src/index.ts'),
```

- Now if you build using `pnpm build`, you should see the build library in `/dist` folder. You will see ES6, and UMD modules.

## Configuring the vite to generate ES6 and common js

We want the output in two formats, one in ES6 for all modern browsers and runtimes. CommoJS for node run time.

- In vite.config.js, we need to add formats in `lib` section:

```
formats:['es', 'cjs']
```

- Build and check if you see both es6 and CommonJS modules getting generated in `/dist` folder.

## Integrate the library in the `apps/web` next js project.

- Fire up another terminal for web app
- `cd apps/web`
- Run the app in dev mode `pnpm dev` and then hit [http://localhost:3000](http://localhost:3000)
- You should see the page with some text and button
- we want to install our lib as a dependency to this app.
- Run `npm install test-lib`
- You will notice pnpm will end up installing an existing package from npm registry with name test-lib. We don't want that. To ensure we don't conflict with npm registry entry, create a unique name using namespace such as @abccomp
- Change the `name` in packages/test-lib/package.json to `@abccomp/test-lib`
- fire up another terminal and cd into apps/web
- now install the `@abccomp/test-lib` by running

```
pnpm install @abccomp/test-lib
```

- pnpm is clever and it will create a symlink to to our local lib module and you can see it in its output:

```
+ @abccomp/test-lib 0.0.0 <- ../../packages/test-lib
```

## Use the library

- open the app/page.tsx
- import `add` function from our library

```
import { add } from '@abccomp/test-lib';
```

and in page.tsx, add this below the <Button>:

```
  <div>{add(10, 30)}</div>
```

- When you go back to browser and check, you will see an error saying module not found.
- This is because, the `package.json` of our library is not giving enough information as to where to find the real module code in the package.
- lets do that now by referring this [recommended package.json](https://vitejs.dev/guide/build.html#library-mode) for lib.
- Copy the following code into package.json of test-lib

```
"
  files": ["dist"],
  "main": "./dist/my-lib.umd.cjs",
  "module": "./dist/my-lib.js",
  "exports": {
    ".": {
      "import": "./dist/my-lib.js",
      "require": "./dist/my-lib.umd.cjs"
    }
  }
```

- modify main to point to the common js, and module to es6 module paths generated in the dist folder. Also fix the `export` entries. Now the entries should look like:

```
 "files": [
    "dist"
  ],
  "main": "./dist/test-lib.cjs",
  "module": "./dist/test-lib.js",
  "exports": {
    ".": {
      "import": "./dist/test-lib.js",
      "require": "./dist/test-lib.cjs"
    }
  },
```

- Now go back in your browser and check the page, it should be displaying 35. Great! Library integration works successfully!.

## Generating type declaration d.ts file for VSCode to help with type completion with our code.

You might observe that when we try to use our `add` function in the app, we don't get any code completion hints. This is because, VSCode is not able to locate the type declarations for our library. Generally type declarations are made available in the form of `<module-name>.d.ts` files right along with our generated modules.

Vite can help us to generate these via `tsc` using a plugin called [vite-plugin-dts](https://www.npmjs.com/package/vite-plugin-dts). Lets install that plugin

- Install the vite-plugin-dts in test-lib package

  ```
    pnpm i vite-plugin-dts -D
  ```

- in `vite.config.js`, import the dts plugin
  `import dts from 'vite-plugin-dts'`
  and add this in the config:
  `plugins:[dts()]`
- the config should look like so:

```
import { resolve } from 'path';
import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';
export default defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'TestLib',
      // the proper extensions will be added
      fileName: 'test-lib',
      formats: ['es', 'cjs'],
    },
  },
  plugins:[dts()]
});

```

- Now if we build the library using `pnpm build` we should see the d.ts files getting created inside `/dist` folder.
- We are not done yet!. We need to add a `types` entry into package.json of test-lib as well. Add the following to the package.json of the test-lib:

```
"types": "./dist/index.d.ts"
```

Now go back to the app, and observe that VSCode no longer warns on not finding types. And also if you will start seeing type hints when you type the function name `add` in the VSCode editor.

## Integrating library into a node js project as ESM and also CommonJS package.

Our library can be used by even a backend code written in node. You can also integrate the library even from a JavaScript code. To experiment this, lets go ahead and create a node app inside /apps folder in our mono-repo. Run the following commands.

```
cd apps
mkdir node-app
cd node-app
pnpm init
touch index.js
touch index.cjs
pnpm install @abccomp/test-lib
```

When we run the above commands, we should see package.json, and index.js, and index.cjs files created inside node-app folder.
If you inspect the package.json, you will see an entry:

```
  "type": "module"
```

Which indicates, by default all js files are ESM modules. However we can tell a particular file is a common js module, by giving `cjs` extension.

Add the following code to index.js

```
import { add } from '@codecraft/test-lib';
console.log(add(40, 50));
```

Add the following code to index.cjs file:

```
const { add } = require('@codecraft/test-lib');
console.log(add(19, 34));
```

Observe how we use different ways of importing symbols in ESM, and CommonJS.

One nice thing about our library is it comes with type declarations, and even inside a JavaScript file, you will get nice code completion hints indicating each argument and type of it.

Test your node files and see both of them successfully use our library.

```
❯ node index.js
90
❯ node index.cjs
53
```

## unit testing typescript code using vitest

Before apps can integrate our libraries, it is important we test the code thoroughly. [Vitest](https://vitest.dev/guide/) is a blazing fast unit test framework powered by Vite. we shall use this to write unit tests for our math module.

First, install vitest:

```
pnpm add -D vitest
```

Create a test file called `math.test.ts` in the same src folder where `math.ts` is located. If you have already written jest tests in other projects, you already know how to write tests using vtest. Add the following code to math.test.ts

```
import { it, expect } from 'vitest';
import { add } from './math';

it('must add two integers correctly', () => {
  const actual = add(10, 25);
  const expected = 35;
  expect(actual).toEqual(expected);
});

```

### running tests

Add the following script to the package.json

```
test: vitest
```

To run the tests, invoke

```
pnpm test
```

you should see the console output that shows that tests are passing.

## Debugging the code via tests.

Ability to debug our code in VSCode is vital to troubleshoot our code. Vite has very good out of the box support for enabling debugging. All you have to do is invoke the [Javascript Debug Terminal in VSCode](https://vitest.dev/guide/debugging.html). Add some breakpoints in your test. In the command line of debug terminal, simply run

```
pnpm test
```

You should see the breakpoint that you have set in your tests will become active with debugger pausing there.

## Conclusion

In this article, we explored, how we can use a mono repo setup to create a TypeScript based library, and demonstrate how to integrate it in a next js app, and also a node application. In the process, we got to know how the tools like Turbo, pnpm, Vite and Vitest can facilitate a comfortable developer experience in building and testing the library.

## References:

- An [excellent tutorial](https://www.youtube.com/watch?v=XDip9onOTps&t=1139s) on the same topic of creating typescript library by Alvaro Dev Labs
- [Turbo mono repo demo](https://www.youtube.com/watch?v=YX5yoApjI3M)
- [Vite documentation](https://vitejs.dev/guide/)
- [Setting up unit testing using Vitest](https://vitest.dev/guide/)
