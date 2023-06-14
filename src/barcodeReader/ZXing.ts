import { BarcodeResult, DetectionResult, Setting, SettingDef } from "./BarcodeReader";
import { MultiFormatReader, BarcodeFormat, RGBLuminanceSource, BinaryBitmap, HybridBinarizer, HTMLVisualMediaElement, HTMLCanvasElementLuminanceSource, Result, ResultPoint, DecodeHintType } from '@zxing/library';
import { DecimalToHex } from "./Shared";
import { Point, Rect } from "src/definitions/definitions";
import { getRectFromPoints } from "src/utils";
import { CameraEnhancer, DCEFrame } from "dynamsoft-camera-enhancer";

export default class ZXing {
  private reader!:MultiFormatReader;
  private canvas!:HTMLCanvasElement;
  private settings:Setting[] = [];
  async init() : Promise<void> {
    if (!this.reader) {
      //const hints:Map<DecodeHintType, any> = new Map<DecodeHintType, any>();
      //hints.set(DecodeHintType.TRY_HARDER,true);
      this.reader = new MultiFormatReader();
      //this.reader.setHints(hints);
    }
    if (!this.canvas) {
      this.canvas = document.createElement("canvas");
    }
  }

  async detect(image: ImageBitmapSource|string|HTMLImageElement|HTMLVideoElement|DCEFrame) : Promise<DetectionResult> {
    const startTime = Date.now();
    if (typeof(image) === "string") {
      image = await this.loadImageFromDataURL(image);
    }
    let binaryBitmap;
    if (image instanceof HTMLCanvasElement) {
      binaryBitmap = this.createBinaryBitmapFromCanvas(image);
    } else if (CameraEnhancer.isDCEFrame(image)) {
      binaryBitmap = this.createBinaryBitmapFromCanvas((image as DCEFrame).toCanvas());
    } else {
      binaryBitmap = this.createBinaryBitmap(image as HTMLVisualMediaElement);
    }
    
    const results = [];
    let result;
    let elapsedTime = 0;
    try {
      result = this.reader.decode(binaryBitmap);
      elapsedTime = Date.now() - startTime; 
    } catch (error) {
      console.log(error);
      elapsedTime = Date.now() - startTime; 
    }
    if (result) {
      results.push(this.wrapResult(result));
    }
    const decodingResult:DetectionResult = {
      elapsedTime:elapsedTime,
      results:results
    };
    return decodingResult;
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

  wrapResult(result:Result):BarcodeResult {
    const rect:Rect = this.getRectFromPoints(result.getResultPoints());
    let bytes = "";
    if (result.getRawBytes()) {
      bytes = this.getBinary(result.getRawBytes());
    }
    const format = BarcodeFormat[result.getBarcodeFormat()];
    const top = rect.top;
    let bottom = rect.bottom;
    if (bottom === top) {
      bottom = top + 2;
    }
    return { 
      barcodeFormat: format, 
      barcodeText: result.getText(),
      barcodeBytes: bytes,
      x1: rect.left,
      x2: rect.right,
      x3: rect.right,
      x4: rect.left,
      y1: top,
      y2: top,
      y3: bottom,
      y4: bottom
    };
  }

  getBinary(bytes:Uint8Array){
    let joined = "";
    for (let index = 0; index < bytes.length; index++) {
      const byte = bytes[index];
      joined = joined + DecimalToHex(byte.toString());
    }
    return joined;
  }

  getRectFromPoints(resultPoints:ResultPoint[]):Rect {
    return getRectFromPoints(this.convertResultPointsToPoints(resultPoints))
  }

  convertResultPointsToPoints(resultPoints:ResultPoint[]):Point[] {
    const points = [];
    for (let index = 0; index < resultPoints.length; index++) {
      const resultPoint = resultPoints[index];
      const point = {x:resultPoint.getX(),y:resultPoint.getY()};
      points.push(point);
    }
    return points;
  }

  createBinaryBitmap(mediaElement: HTMLVisualMediaElement): BinaryBitmap {
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
    ctx!.drawImage(mediaElement, 0, 0, width, height);
    return this.createBinaryBitmapFromCanvas(this.canvas);
  }

  createBinaryBitmapFromCanvas(cvs: HTMLCanvasElement):BinaryBitmap {
    const luminanceSource = new HTMLCanvasElementLuminanceSource(cvs);
    const hybridBinarizer = new HybridBinarizer(luminanceSource);
    const bitmap = new BinaryBitmap(hybridBinarizer);
    return bitmap;
  }

  static getSupportedSettings():SettingDef[] {
    return [];
  }

  static getDefaultSettings():any {
    return {};
  }

  static getSettingOptions(key:string,settings:Setting[]):string[] {
    return [];
  }

  async setSettings(settings:any):Promise<void> {
    this.settings = settings;
  }
}