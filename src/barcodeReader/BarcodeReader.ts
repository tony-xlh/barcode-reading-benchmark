import DynamsoftBarcodeReader from "./DynamsoftBarcodeReader";
import { BarcodeReader as DBR} from "dynamsoft-javascript-barcode";



export class BarcodeReader {
  private reader: DynamsoftBarcodeReader;
  constructor(){
    this.reader = new DynamsoftBarcodeReader();
  }

  setEngine(name:string){
    console.log(name);
  }

  async initDBR() : Promise<DBR> {
    return await DynamsoftBarcodeReader.init();
  }

  detect(image:ImageBitmapSource) : Promise<DecodingResult> {
    return this.reader.detect(image);
  }

  static getEngines():string[] {
    return ["Dynamsoft"];
  }
}

export interface DecodingResult {
  elapsedTime:number;
  results:BarcodeResult[];
}

export interface BarcodeResult {
  barcodeFormat: string;
  barcodeText: string;
  barcodeBytes: string;
  confidence?: number;
  x1:number;
  x2:number;
  x3:number;
  x4:number;
  y1:number;
  y2:number;
  y3:number;
  y4:number;
}
