import { BarcodeReader, TextResult } from "dynamsoft-javascript-barcode";
import { BarcodeResult, DecodingResult } from "./BarcodeReader";
import { DecimalToHex } from "./Shared";

BarcodeReader.engineResourcePath = "https://unpkg.com/dynamsoft-javascript-barcode@9.6.11/dist/";

let reader:BarcodeReader;
export default class DynamsoftBarcodeReader {
  static async init() : Promise<BarcodeReader> {
    reader = await BarcodeReader.createInstance();
    return reader;
  }

  async detect(image: ImageBitmapSource|string) : Promise<DecodingResult> {
    if (!reader) {
      throw new Error("Dynamsoft Barcode Reader has not been initialized.");
    }
    const startTime = Date.now();
    const results:TextResult[] = await reader.decode(image as any);
    const elapsedTime = Date.now() - startTime;
    const barcodes:BarcodeResult[] = [];
    results.forEach(result => {
      const barcode:BarcodeResult = this.wrapResult(result);
      barcodes.push(barcode);
    });
    const decodingResult:DecodingResult = {
      elapsedTime:elapsedTime,
      results:barcodes
    };
    return decodingResult;
  }

  wrapResult(result:TextResult):BarcodeResult{
    const confidence = (result as any)["results"][0]["confidence"];
    return { 
      barcodeFormat: result.barcodeFormatString, 
      barcodeText: result.barcodeText,
      barcodeBytes: this.getBinary(result.barcodeBytes),
      confidence: confidence,
      x1: result.localizationResult.x1,
      x2: result.localizationResult.x2,
      x3: result.localizationResult.x3,
      x4: result.localizationResult.x4,
      y1: result.localizationResult.y1,
      y2: result.localizationResult.y2,
      y3: result.localizationResult.y3,
      y4: result.localizationResult.y4
    };
  }

  getBinary(bytes:number[]){
    let joined = "";
    for (let index = 0; index < bytes.length; index++) {
      const byte = bytes[index];
      joined = joined + DecimalToHex(byte.toString());
    }
    return joined;
  }
}