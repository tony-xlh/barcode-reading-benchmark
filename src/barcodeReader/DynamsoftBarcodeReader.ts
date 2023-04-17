import { BarcodeReader, TextResult } from "dynamsoft-javascript-barcode";
import { BarcodeResult, Point2D } from "./BarcodeReader";

BarcodeReader.engineResourcePath = "https://unpkg.com/dynamsoft-javascript-barcode@9.6.11/dist/";

let reader:BarcodeReader;
export default class DynamsoftBarcodeReader {
  static async init() : Promise<BarcodeReader> {
    reader = await BarcodeReader.createInstance();
    return reader;
  }

  async detect(image: ImageBitmapSource) : Promise<BarcodeResult[]> {
    if (!reader) {
      throw new Error("Dynamsoft Barcode Reader has not been initialized.");
    }
    const results:TextResult[] = await reader.decode(image as any);
    const barcodes:BarcodeResult[] = [];
    results.forEach(result => {
      const barcode:BarcodeResult = this.wrapResult(result);
      barcodes.push(barcode);
    });
    return barcodes;
  }

  wrapResult(result:TextResult):BarcodeResult{
    const cornerPoints:Point2D[] = [];
    for (let index = 1; index < 5; index++) {
      const localizationResult:any = result.localizationResult;
      const x = localizationResult["x"+index];
      const y = localizationResult["y"+index];
      const point:Point2D = {x:x,y:y};
      cornerPoints.push(point);
    }
    return { 
      barcodeFormat: result.barcodeFormatString, 
      barcodeText: result.barcodeText,
      barcodeBinary: result.barcodeBytes.toString(),
      cornerPoints:cornerPoints
    };
  }
}