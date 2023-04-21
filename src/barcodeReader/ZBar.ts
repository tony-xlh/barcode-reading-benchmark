import { Point, Rect } from "src/definitions/definitions";
import { BarcodeResult, DetectionResult } from "./BarcodeReader";
import { getRectFromPoints } from "src/utils";
import { DecimalToHex } from "./Shared";

export default class ZBar {
  private canvas!:HTMLCanvasElement;
  private reader:any;
  async init() : Promise<void> {
    if (!this.canvas) {
      this.canvas = document.createElement("canvas");
    }
    this.reader = (window as any)["zbarWasm"];
  }

  async detect(image: ImageBitmapSource|string|HTMLImageElement|HTMLVideoElement) : Promise<DetectionResult> {
    const startTime = Date.now();
    if (image instanceof HTMLCanvasElement) {
      image = image.toDataURL(); 
    }
    if (typeof(image) === "string") {
      image = await this.loadImageFromDataURL(image);
    }
    let elapsedTime = 0;
    const results:BarcodeResult[] = [];
    const imageData = this.getImageData(image as any);
    if (imageData) {
      const symbols = await this.reader.scanImageData(imageData);
      elapsedTime = Date.now() - startTime; 
      for (let index = 0; index < symbols.length; index++) {
        const symbol = symbols[index];
        results.push(this.wrapResult(symbol));
      }
    }
    
    const decodingResult:DetectionResult = {
      elapsedTime:elapsedTime,
      results:results
    };
    return decodingResult;
  }

  wrapResult(result:any):BarcodeResult {
    const rect = this.getRectFromPoints(result.points);
    const bytes = this.getBinary(result.data);
    return { 
      barcodeFormat: result.typeName, 
      barcodeText: result.decode(),
      barcodeBytes: bytes,
      confidence: result.quality,
      x1: rect.left,
      x2: rect.right,
      x3: rect.right,
      x4: rect.left,
      y1: rect.top,
      y2: rect.top,
      y3: rect.bottom,
      y4: rect.bottom
    };
  }

  getRectFromPoints(resultPoints:any[]):Rect {
    return getRectFromPoints(this.convertZBarPointsToPoints(resultPoints))
  }

  convertZBarPointsToPoints(resultPoints:any[]):Point[] {
    const points = [];
    for (let index = 0; index < resultPoints.length; index++) {
      const resultPoint = resultPoints[index];
      const point = {x:resultPoint.x,y:resultPoint.y};
      points.push(point);
    }
    return points;
  }

  getImageData(mediaElement:HTMLImageElement|HTMLVideoElement) :ImageData|undefined{
    const ctx = this.canvas.getContext("2d");
    let width;
    let height;
    if (mediaElement instanceof HTMLVideoElement) {
      width = mediaElement.videoWidth;
      height = mediaElement.videoHeight;
    }else{
      width = mediaElement.naturalWidth;
      height = mediaElement.naturalHeight;
    }
    this.canvas.width  = width;
    this.canvas.height = height;
    ctx?.drawImage(mediaElement, 0, 0, width, height);
    return ctx?.getImageData(0, 0, width, height);
  }

  loadImageFromDataURL(dataURL:string):Promise<HTMLImageElement> {
    return new Promise(async function (resolve, reject) {
      try {
        const img = new Image();
        img.src = dataURL;
        img.onload = function(){
          resolve(img);
        }
      } catch (error) {
        reject(error); //it may not work with virtual cameras
      }
    });
  }

  getBinary(bytes:Int8Array){
    let joined = "";
    for (let index = 0; index < bytes.length; index++) {
      const byte = bytes[index];
      joined = joined + DecimalToHex(byte.toString());
    }
    return joined;
  }
}