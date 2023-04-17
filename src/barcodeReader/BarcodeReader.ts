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

  detect(image:ImageBitmapSource) : Promise<BarcodeResult[]> {
    return this.reader.detect(image);
  }

  static getEngines():string[] {
    return ["Dynamsoft"];
  }
}

export interface BarcodeResult {
  barcodeFormat:string;
  barcodeText:string;
  barcodeBinary: string;
  cornerPoints: ReadonlyArray<Point2D>;
}

export interface Point2D {
  x : number, 
  y : number
};
