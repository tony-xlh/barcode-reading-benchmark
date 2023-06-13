import { BarcodeReader, EnumBarcodeFormat, TextResult } from "dynamsoft-javascript-barcode";
import { BarcodeResult, DetectionResult } from "./BarcodeReader";
import { DecimalToHex } from "./Shared";
import Encoding from "encoding-japanese";
import { DCEFrame } from "dynamsoft-camera-enhancer";

BarcodeReader.engineResourcePath = "https://unpkg.com/dynamsoft-javascript-barcode@9.6.20/dist/";

let reader:BarcodeReader;
export default class DynamsoftBarcodeReader {
  private settings:any;
  async init() : Promise<void> {
    if (!reader) {
      reader = await BarcodeReader.createInstance();
      await reader.updateRuntimeSettings('balance');
    }
  }

  async detect(image: ImageBitmapSource|string|HTMLImageElement|HTMLVideoElement|DCEFrame) : Promise<DetectionResult> {
    if (!reader) {
      throw new Error("Dynamsoft Barcode Reader has not been initialized.");
    }
    const startTime = Date.now();
    const results:TextResult[] = await reader.decode(image as any);
    console.log(results);
    const elapsedTime = Date.now() - startTime;
    const barcodes:BarcodeResult[] = [];
    results.forEach(result => {
      const barcode:BarcodeResult = this.wrapResult(result);
      barcodes.push(barcode);
    });
    const decodingResult:DetectionResult = {
      elapsedTime:elapsedTime,
      results:barcodes
    };
    return decodingResult;
  }

  wrapResult(result:TextResult):BarcodeResult{
    let barcodeText = result.barcodeText;
    const confidence = (result as any)["results"][0]["confidence"];
    if (result.barcodeFormat === EnumBarcodeFormat.BF_QR_CODE) {
      const mode = (result as any)["detailedResult"]["mode"];
      if (mode === 8) {
        const sjisArray = result.barcodeBytes;
        const unicodeArray = Encoding.convert(sjisArray, { to: 'UNICODE', from: 'SJIS'}); 
        barcodeText = Encoding.codeToString(unicodeArray); // Convert code array to string
      }
    }

    barcodeText = barcodeText.replace("\u001d",""); // remove GS head.

    return { 
      barcodeFormat: result.barcodeFormatString, 
      barcodeText: barcodeText,
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

  async updateRuntimeSettings(template:string){
    if (template) {
      if (template.indexOf("{") != -1) { //json template
        console.log("Using JSON template: "+template);
        await reader.initRuntimeSettingsWithString(template);
      }else{ //built-in template names
        console.log("Using built-in template: "+template);
        await reader.updateRuntimeSettings(template);
      }
    }else{
      await reader.resetRuntimeSettings();
    }
    
  }

  getSupportedSettings():string[] {
    return ["template"];
  }

  async setSupportedSettings(settings:any):Promise<void> {
    this.settings = settings;
    for (let index = 0; index < settings.length; index++) {
      const setting = settings[index];
      if (setting.name === "template") {
        await this.updateRuntimeSettings(setting.value);
      }
    }
  }
}