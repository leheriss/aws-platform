import path = require('path');
import * as fs from 'fs';

function isJsonString(str: string): boolean {
  try {
    JSON.parse(str);
    return true;
  } catch (e) {
    return false;
  }
}

export function getContent(contentFile: string): string {
  const projectRoot = path.resolve(__dirname, '../'); // Adjust according to your project structure

  if (isJsonString(contentFile)) {
    // It's a JSON string
    return contentFile;
  } else {
    // It's a file path
    const filePath = path.join(projectRoot, contentFile); // Adjust the base path as needed
    return fs.readFileSync(filePath, 'utf8');
  }
}
