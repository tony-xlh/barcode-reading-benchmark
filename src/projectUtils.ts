import { getFilenameWithoutExtension } from "./utils";
import localForage from "localforage";
import JSZip from "jszip";
import { Project } from "./project";

export async function textResultsImported(projectObj:Project):Promise<boolean>{
  const name = projectObj.info.name;
  const result = await localForage.getItem(name+":detectionResultFileNamesList");
  if (result) {
    return true;
  }
  return false;
}

export async function loadTextResultsFromZip (projectObj:Project):Promise<boolean> {
  const blob:Blob|null|undefined = await localForage.getItem(projectObj.info.name+":results.zip");
  if (blob) {
    const zip = new JSZip();
    await zip.loadAsync(blob);
    const detectionResultFileNamesListString = await zip.file("detection_result_filenames.json")?.async("string");
    if (detectionResultFileNamesListString) {
      const detectionResultFileNamesList:string[] = JSON.parse(detectionResultFileNamesListString);
      for (let index = 0; index < detectionResultFileNamesList.length; index++) {
        const detectionResultFileName = detectionResultFileNamesList[index];
        const detectionResultString:string|undefined = await zip.file(detectionResultFileName)?.async("string");
        if (detectionResultString) {
          await localForage.setItem(projectObj.info.name+":detectionResult:"+detectionResultFileName,detectionResultString);
        }
      }
      await localForage.setItem(projectObj.info.name+":detectionResultFileNamesList",detectionResultFileNamesList);
    }
    for (let index = 0; index < projectObj.info.images.length; index++) {
      const imageName = projectObj.info.images[index];
      const groundTruthName = getFilenameWithoutExtension(imageName)+".txt";
      const key = projectObj.info.name+":groundTruth:"+groundTruthName;
      const groundTruthString:string|undefined = await zip.file(groundTruthName)?.async("string");
      if (groundTruthString) {
        await localForage.setItem(key,groundTruthString);
      }
    }

    const settingsString = await zip.file("settings.json")?.async("string");
    if (settingsString) {
      await localForage.setItem(projectObj.info.name+":settings",JSON.parse(settingsString));
    }

    return true;
  }
  return false;
}