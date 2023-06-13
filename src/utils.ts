import { BarcodeReader, BarcodeResult, DetectionResult } from "./barcodeReader/BarcodeReader";
import { DetectionStatistics, EngineDataTableRow, GroundTruth, PerformanceMetrics, Point, EngineStatistics, Rect } from "./definitions/definitions";
import leven from 'leven';
import { Project } from "./project";
import localForage from "localforage";

//scanned.jpg => scanned
export const getFilenameWithoutExtension = (filename:string) => {
  if (filename.lastIndexOf(".") != -1) {
    return filename.substring(0,filename.lastIndexOf("."));
  }else{
    return filename;
  }
}

export const readFileAsDataURL = async (file:File):Promise<string> => {
  return new Promise(function (resolve, reject) {
    const fileReader = new FileReader();
    fileReader.onload = function(e:any){
      resolve(e.target.result);
    };
    fileReader.onerror = function () {
      reject('oops, something went wrong.');
    };
    fileReader.readAsDataURL(file);
  });
}

export const readFileAsText = async (file:File):Promise<string> => {
  return new Promise(function (resolve, reject) {
    const fileReader = new FileReader();
    fileReader.onload = function(e:any){
      resolve(e.target.result);
    };
    fileReader.onerror = function () {
      reject('oops, something went wrong.');
    };
    fileReader.readAsText(file);
  });
}

export const calculateEngineStatistics = async (project:Project,engine:string) => {
  const projectName = project.info.name;
  const newRows = [];
  let totalBarcodes = 0;
  let totalBarcodesCorrectlyDetected = 0;
  let totalBarcodesMisDetected = 0;
  let totalBarcodesDetected = 0;
  let totalElapsedTime = 0;
  let detectedFiles = 0;
  let detectedFilesWithResults = 0;
  let totalCorrectFiles = 0;
  for (let index = 0; index < project.info.images.length; index++) {
    const imageName = project.info.images[index];
    let joinedGroundTruth = "";
    let groundTruthList:GroundTruth[] = [];
    const groundTruthString:string|null|undefined = await localForage.getItem(projectName+":groundTruth:"+getFilenameWithoutExtension(imageName)+".txt");
    if (groundTruthString) {
      groundTruthList = JSON.parse(groundTruthString);
      joinedGroundTruth = getJoinedGroundTruth(groundTruthList);
    }
    let joinedDetectionResult = "";
    let elapsedTime = "";
    let barcodeFormat = "";
    let correct = "";
    let misdetected = "";
    const detectionResultString:string|null|undefined = await localForage.getItem(projectName+":detectionResult:"+getFilenameWithoutExtension(imageName)+"-"+engine+".json");
    if (detectionResultString) {
      const detectionResult:DetectionResult = JSON.parse(detectionResultString);
      joinedDetectionResult = getJoinedDetectionResult(detectionResult)
      barcodeFormat = getJoinedBarcodeFormat(detectionResult);
      elapsedTime = detectionResult.elapsedTime.toString();
      totalElapsedTime = totalElapsedTime + detectionResult.elapsedTime;
      const detectionStatistics = calculateDetectionStatistics(detectionResult.results,groundTruthList);
      if (detectionStatistics.groundTruth != 0) {
        if (detectionStatistics.correct === detectionStatistics.groundTruth) {
          correct = "true";
        }else{
          correct = "false";
        }
      }else{
        if (detectionResult.results.length > 0) {
          correct = "true";
        }else{
          correct = "false";
        }
      }
      if (detectionResult.results.length>0) {
        detectedFilesWithResults = detectedFilesWithResults + 1;
      }
      detectedFiles = detectedFiles + 1;
      misdetected = detectionStatistics.misdetected.toString();
      totalBarcodes = totalBarcodes + groundTruthList.length;
      totalBarcodesDetected = totalBarcodesDetected + detectionResult.results.length;
      totalBarcodesCorrectlyDetected = totalBarcodesCorrectlyDetected + detectionStatistics.correct;
      totalBarcodesMisDetected = totalBarcodesMisDetected + detectionStatistics.misdetected;
    }
    if (correct === "true") {
      totalCorrectFiles = totalCorrectFiles + 1;
    }
    const row:EngineDataTableRow = {
      number: (index + 1),
      filename: imageName,
      groundTruth: joinedGroundTruth,
      detectedText: joinedDetectionResult,
      time: elapsedTime,
      barcodeFormat: barcodeFormat,
      correct: correct,
      misdetected: misdetected
    }
    newRows.push(row);
  }
  const accuracy = parseFloat((totalBarcodesCorrectlyDetected / totalBarcodes * 100).toFixed(2));
  const precision = parseFloat(((totalBarcodesDetected - totalBarcodesMisDetected) / totalBarcodesDetected * 100).toFixed(2));
  const detectedFilesRate = parseFloat((detectedFilesWithResults / project.info.images.length * 100).toFixed(2));
  const performanceMetrics:PerformanceMetrics = {
    fileNumber: project.info.images.length,
    correctFilesNumber: totalCorrectFiles,
    barcodeNumber: totalBarcodes,
    accuracy: accuracy,
    precision: precision,
    detectedFilesRate: detectedFilesRate,
    averageTime: parseFloat((totalElapsedTime / detectedFiles).toFixed(2))
  }
  const engineStatistics:EngineStatistics = {
    name:engine,
    metrics:performanceMetrics,
    rows:newRows
  };
  return engineStatistics;
}

const getJoinedGroundTruth = (groundTruthList:GroundTruth[]) => {
  let joined = "";
  for (let index = 0; index < groundTruthList.length; index++) {
    const groundTruth = groundTruthList[index];
    joined = joined + groundTruth.text;
    if (index != groundTruthList.length - 1) {
      joined = joined + ", ";
    }
  }
  return joined;
}

const getJoinedDetectionResult = (detectionResult:DetectionResult) => {
  let joined = "";
  for (let index = 0; index < detectionResult.results.length; index++) {
    const result = detectionResult.results[index];
    joined = joined + result.barcodeText;
    if (index != detectionResult.results.length - 1) {
      joined = joined + ", ";
    }
  }
  return joined;
}

const getJoinedBarcodeFormat = (detectionResult:DetectionResult) => {
  let joined = "";
  for (let index = 0; index < detectionResult.results.length; index++) {
    const result = detectionResult.results[index];
    joined = joined + result.barcodeFormat;
    if (index != detectionResult.results.length - 1) {
      joined = joined + ", ";
    }
  }
  return joined;
}

export const calculateDetectionStatistics = (barcodeResultList:BarcodeResult[],groundTruthList:GroundTruth[]):DetectionStatistics => {
  const groundTruthNumber = groundTruthList.length;
  const detectedBarcodesNumber = barcodeResultList.length;
  let misdetected = 0;
  let correct = 0;
  for (let i = 0; i < barcodeResultList.length; i++) {
    const barcodeResult = barcodeResultList[i];
    for (let j = 0; j < groundTruthList.length; j++) {
      const groundTruth = groundTruthList[j];
      let IoU;
      if (groundTruth.hasLocation === false) {
        IoU = 1.0;
      }else{
        const points1 = getPointsFromBarcodeResultResult(barcodeResult);
        const points2 = getPointsFromGroundTruth(groundTruth);
        IoU = intersectionOverUnion(points1,points2);
      }
      if (IoU > 0.05) {
        if (groundTruth.text) {
          if (textCorrect(groundTruth,barcodeResult)) {
            correct = correct + 1;
          }else{
            misdetected = misdetected + 1;  
          }
        }else{
          correct = correct + 1;
        }
        break;
      }
    }
  }
  return {
    groundTruth:groundTruthNumber,
    detected:detectedBarcodesNumber,
    misdetected:misdetected,
    correct:correct
  }
}

export function textCorrect(groundTruth:GroundTruth,barcodeResult:BarcodeResult){
  if (groundTruth.value_attrib.Mode === "binary") {
    const distance = leven(groundTruth.text,barcodeResult.barcodeBytes)/4;
    const similarity =  (1 - distance / Math.max(groundTruth.text.length,barcodeResult.barcodeBytes.length));
    if (similarity >= 0.85) {
      return true;
    }else{
      return false;
    }
  }else{
    let groundTruthText = groundTruth.text;
    let barcodeText = barcodeResult.barcodeText;
    if (barcodeResult.barcodeFormat.toLowerCase().indexOf("upc") != -1 && groundTruth.attrib.Type.toLowerCase().indexOf("ean") != -1) {
      if (barcodeText != groundTruthText) {
        barcodeText = "0" + barcodeText;
      }
    }
    if (barcodeResult.barcodeFormat.toLowerCase().indexOf("ean") != -1 && groundTruth.attrib.Type.toLowerCase().indexOf("upc") != -1) {
      if (barcodeText != groundTruthText) {
        barcodeText = barcodeText.substring(1,barcodeText.length);
      }
    }
    barcodeText = removeAddedText(barcodeText);
    barcodeText = removeInteferenceText(barcodeText);
    groundTruthText = removeInteferenceText(groundTruthText);
    if (groundTruthText === barcodeText) {
      return true;
    }else{
      return false;
    }
  }
}

function removeAddedText(barcodeText:string):string {
  barcodeText = barcodeText.replaceAll("{GS}","");
  return barcodeText;
}

function removeInteferenceText(text:string):string {
  text = text.replaceAll("\r","");
  text = text.replaceAll("\n","");
  text = text.replaceAll("\t","");
  return text;
}

export function getPointsFromGroundTruth(groundTruth:GroundTruth) {
  const p1:Point = {x:groundTruth.x1,y:groundTruth.y1};
  const p2:Point = {x:groundTruth.x2,y:groundTruth.y2};
  const p3:Point = {x:groundTruth.x3,y:groundTruth.y3};
  const p4:Point = {x:groundTruth.x4,y:groundTruth.y4};
  return [p1,p2,p3,p4];
}

export function getPointsFromBarcodeResultResult(barcodeResult:BarcodeResult) {
  const p1:Point = {x:barcodeResult.x1,y:barcodeResult.y1};
  const p2:Point = {x:barcodeResult.x2,y:barcodeResult.y2};
  const p3:Point = {x:barcodeResult.x3,y:barcodeResult.y3};
  const p4:Point = {x:barcodeResult.x4,y:barcodeResult.y4};
  return [p1,p2,p3,p4];
}

export function intersectionOverUnion(pts1:Point[] ,pts2:Point[]) : number {
  const rect1 = getRectFromPoints(pts1);
  const rect2 = getRectFromPoints(pts2);
  return rectIntersectionOverUnion(rect1, rect2);
}

function rectIntersectionOverUnion(rect1:Rect, rect2:Rect) : number {
  const leftColumnMax = Math.max(rect1.left, rect2.left);
  const rightColumnMin = Math.min(rect1.right,rect2.right);
  const upRowMax = Math.max(rect1.top, rect2.top);
  const downRowMin = Math.min(rect1.bottom,rect2.bottom);

  if (leftColumnMax>=rightColumnMin || downRowMin<=upRowMax){
    return 0;
  }

  const s1 = rect1.width*rect1.height;
  const s2 = rect2.width*rect2.height;
  const sCross = (downRowMin-upRowMax)*(rightColumnMin-leftColumnMax);
  return sCross/(s1+s2-sCross);
}

export function getRectFromPoints(points:Point[]) : Rect {
  if (points[0]) {
    let left:number;
    let top:number;
    let right:number;
    let bottom:number;
    
    left = points[0].x;
    top = points[0].y;
    right = 0;
    bottom = 0;

    points.forEach(point => {
      left = Math.min(point.x,left);
      top = Math.min(point.y,top);
      right = Math.max(point.x,right);
      bottom = Math.max(point.y,bottom);
    });

    const r:Rect = {
      left: left,
      top: top,
      right: right,
      bottom: bottom,
      width: right - left,
      height: bottom - top
    };
    
    return r;
  }else{
    throw new Error("Invalid number of points");
  }
}

export const removeProjectFiles = async (project:Project) => {
  for (let index = 0; index < project.info.images.length; index++) {
    const imageName = project.info.images[index];
    await localForage.removeItem(project.info.name+":image:"+imageName);
    await localForage.removeItem(project.info.name+":groundTruth:"+getFilenameWithoutExtension(imageName)+".txt");
  }
  const detectionResultFileNamesList:undefined|null|string[] = await localForage.getItem(project.info.name+":detectionResultFileNamesList");
  if (detectionResultFileNamesList) {
    for (let index = 0; index < detectionResultFileNamesList.length; index++) {
      const filename = detectionResultFileNamesList[index];
      await localForage.removeItem(project.info.name+":detectionResult:"+filename);  
    }
  }
  const engines = BarcodeReader.getEngines();
  for (let index = 0; index < engines.length; index++) {
    const engine = engines[index];
    await localForage.removeItem(project.info.name+":settings:"+engine);
  }
  await localForage.removeItem(project.info.name+":detectionResultFileNamesList");
  await localForage.removeItem(project.info.name+":results.zip");
  project.info.images = [];
}

export function dataURLtoBlob(dataURL:string):Blob {
  const mime = dataURL.split(',')[0].split(':')[1].split(';')[0];
  const binary = atob(dataURL.split(',')[1]);
  const array = [];
  for (let i = 0; i < binary.length; i++) {
     array.push(binary.charCodeAt(i));
  }
  return new Blob([new Uint8Array(array)], {type: mime});
}

export function BlobtoDataURL(blob:Blob):Promise<string> {
  return new Promise(function (resolve,reject) {
    const fr = new FileReader();
    fr.onload = function (e) {
      if (e.target) {
        if (typeof(e.target.result) === "string") {
          resolve(e.target.result);
        }else{
          reject("")
        }
      }
    }
    fr.readAsDataURL(blob)
  });
}

export const loadBarcodeReaderSettings = async (projectName:string,engine:string,settingsItems:string[]) => {
  const savedSettings:any = await localForage.getItem(projectName+":settings:"+engine);
  const items:{name:string,value:string}[] = [];
  for (let i = 0; i < settingsItems.length; i++) {
    const setting = settingsItems[i];
    let value = "";
    if (savedSettings) {
      for (let j = 0; j < savedSettings.length; j++) {
        const savedSettingsItem = savedSettings[j];
        if (savedSettingsItem.name === setting) {
          value = savedSettingsItem.value;
        }
      }
    }
    const item: {name:string,value:string} = {
      name: setting,
      value: value
    }
    items.push(item);
  }
  return items;
}

export function sleep(time:number){
  return new Promise(function(resolve){
    setTimeout(resolve, time);
  });
}

export function ConvertBarcodeResultsToGroundTruth(barcodeResults:BarcodeResult[]):GroundTruth[] {
  const listOfGroundTruth:GroundTruth[] = [];
  for (let index = 0; index < barcodeResults.length; index++) {
    const result = barcodeResults[index];
    listOfGroundTruth.push(ConvertBarcodeResultToGroundTruth(result));
  }
  return listOfGroundTruth;
}

export function ConvertBarcodeResultToGroundTruth(result:BarcodeResult):GroundTruth {
  const groundTruth:GroundTruth = {
    text: result.barcodeText,
    attrib:{Type:result.barcodeFormat},
    value_attrib:{},
    x1:result.x1,
    x2:result.x2,
    x3:result.x3,
    x4:result.x4,
    y1:result.y1,
    y2:result.y2,
    y3:result.y3,
    y4:result.y4
  }
  return groundTruth;
}