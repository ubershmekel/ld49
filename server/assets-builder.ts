// node.js file
// Launched from `npm run asset-build` and generates
// the `assets-generated.ts` file.

import * as fs from 'fs';
import path from 'path';
import { execFile } from 'child_process';

const assetsDir = 'assets';
const banner = `//////////////////////////////////////////////////////
// GENERATED FILE - DO NOT EDIT
// GENERATED FILE - DO NOT EDIT
// GENERATED FILE - DO NOT EDIT
// See "assets-builder.ts" for more information.
//////////////////////////////////////////////////////
`;

function generateURLExports(namesList: string[]) {
  const out = [];
  for (const fileName of namesList) {
    const jsName = jsNamify(fileName);
    const varName = `${jsName}Url`;
    // vite imports json as the parsed object
    // ?raw is the string
    // ?url is the url
    const line = `import ${varName} from '../${assetsDir}/${fileName}?url';`;
    out.push(line);

    const eLine = `export { ${varName} };`
    out.push(eLine);
  }
  return out;
}

function jsNamify(fileName: string) {
  return fileName.replace(/[\.\-]/g, '');
}

function exportAseprite(files: string[]) {
  const exe = "C:\\Program Files\\Aseprite-v1.3-beta6\\Aseprite.exe";
  // const assetsDir = 'assets';
  // https://www.aseprite.org/docs/cli/#create-a-texture-atlas-from-several-sprites
  // aseprite.exe --batch *.ase --sheet-pack --sheet atlas-bestfit.png --data atlas-bestfit.json
  for (const fileName of files) {
    const args = [
      '--batch',
      '--list-tags',
      '--sheet-pack',
      '--trim',
      // Padding is required per:
      // https://newdocs.phaser.io/docs/3.54.0/focus/Phaser.Loader.LoaderPlugin-aseprite
      '--border-padding', '2',
      '--shape-padding', '2',
      '--inner-padding', '2',
      // The filename is how the aseprite phaser loader works
      '--filename-format', "{frame}",
      '--sheet', `${fileName}.sheet.png`,
      '--data', `${fileName}.sheet.json`,
      fileName,
    ];
    execFile(exe, args, (err, stdout, stderr) => {
      console.log(`aseprite stdout: ${stdout}`);
      console.log(`aseprite stderr: ${stderr}`);
      if (err) {
        // node couldn't execute the command
        console.error("Failed to run aseprite", err);
        return;
      }
    });
  }
}

// function generatePhaserTools(out: string[], files: string[], loaders: any) {
//   out.push("import 'phaser';");
//   // keys
//   out.push('\nexport const fkey = {');
//   for (const fileName of files) {
//     const jsName = jsNamify(fileName);
//     const line = `  ${jsName}: '${jsName}',`;
//     out.push(line);
//   }
//   out.push('}');

//   // preload function
//   out.push('\nexport function preloadAll(scene: Phaser.Scene) {');
//   for (const fileName of files) {
//     const ext = path.extname(fileName) as keyof typeof loaders;
//     const jsName = jsNamify(fileName);
//     const line = `  scene.load.${loaders[ext]}(fkey.${jsName}, ${jsName}Url);`;
//     out.push(line);
//   }
//   out.push('}');
// }

function gatherFiles(where: string) {
  let allFiles = fs.readdirSync(where);
  const loaders = {
    '.png': 'image',
    '.mp3': 'audio',
  };

  // filter which files to process
  const loaderFiles = [];
  const aseprites = [];
  const jsonFiles = [];
  for (const fileName of allFiles) {
    if (fileName.startsWith('_')) {
      console.log("skipping generated (starts with underscore):", fileName);
      continue;
    }
    const ext = path.extname(fileName);
    if (ext === '.ase') {
      aseprites.push(fileName);
      continue;
    }
    if (ext in loaders) {
      loaderFiles.push(fileName);
    }
    if (ext === '.json') {
      jsonFiles.push(fileName);
    }
  }

  return {
    loaderFiles,
    aseprites,
    jsonFiles,
    allFiles,
  }
}

function main() {

  // Simplify all the processing to just be local directory
  process.chdir(assetsDir);

  const dst = `../src/assets-generated.ts`;

  let filesObj = gatherFiles('.');

  // aseprite generates more files
  exportAseprite(filesObj.aseprites);
  filesObj = gatherFiles('.');

  const urlLines = generateURLExports(filesObj.allFiles);

  const out = [banner, ...urlLines];

  // generatePhaserTools(out, filesObj.loaderFiles, loaders);

  fs.writeFileSync(dst, out.join('\n'));
  console.log("wrote", dst);
  // console.log(banner);
  // console.log(files);
}

main();
