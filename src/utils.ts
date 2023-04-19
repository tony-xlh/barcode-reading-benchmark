import { BarcodeResult, DetectionResult } from "./barcodeReader/BarcodeReader";
import { DetectionStatistics, GroundTruth, Point, Rect } from "./definitions/definitions";

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

export const calculateDetectionStatistics = (barcodeResultList:BarcodeResult[],groundTruthList:GroundTruth[]):DetectionStatistics => {
  const groundTruthNumber = groundTruthList.length;
  const detectedBarcodesNumber = barcodeResultList.length;
  let misdetected = 0;
  let correct = 0;
  for (let i = 0; i < barcodeResultList.length; i++) {
    const barcodeResult = barcodeResultList[i];
    for (let j = 0; j < groundTruthList.length; j++) {
      const groundTruth = groundTruthList[j];
      const points1 = getPointsFromBarcodeResultResult(barcodeResult);
      const points2 = getPointsFromGroundTruth(groundTruth);
      if (intersectionOverUnion(points1,points2) > 0.3) {
        if (groundTruth.text) {
          if (groundTruth.value_attrib.Mode === "binary") {
            if (groundTruth.text === barcodeResult.barcodeBytes) {
              correct = correct + 1;
            }else{
              misdetected = misdetected + 1;
            }
          }else{
            let barcodeText = barcodeResult.barcodeText;
            barcodeText = removeAddedText(barcodeText);
            barcodeText = removeInteferenceText(barcodeText);
            let groundTruthText = groundTruth.text;
            groundTruthText = removeInteferenceText(groundTruthText);
            if (groundTruthText === barcodeText) {
              correct = correct + 1;
            }else{
              misdetected = misdetected + 1;
            }
          }
        }else{
          correct = correct + 1;
        }
        continue;
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

function getPointsFromGroundTruth(groundTruth:GroundTruth) {
  const p1:Point = {x:groundTruth.x1,y:groundTruth.y1};
  const p2:Point = {x:groundTruth.x2,y:groundTruth.y2};
  const p3:Point = {x:groundTruth.x3,y:groundTruth.y3};
  const p4:Point = {x:groundTruth.x4,y:groundTruth.y4};
  return [p1,p2,p3,p4];
}

function getPointsFromBarcodeResultResult(barcodeResult:BarcodeResult) {
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

function getRectFromPoints(points:Point[]) : Rect {
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
