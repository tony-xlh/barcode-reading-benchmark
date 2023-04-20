import DynamsoftBarcodeReader from "./DynamsoftBarcodeReader";
import ZBar from "./ZBar";
import ZXing from "./ZXing";

export class BarcodeReader {
  private engine = "Dynamsoft";
  private reader!: DynamsoftBarcodeReader|ZXing|ZBar;
  static async createInstance(engine:string):Promise<BarcodeReader> {
    const reader = new BarcodeReader();
    reader.setEngine(engine);
    await reader.init()
    return reader;
  }

  setEngine(name:string) {
    this.engine = name;
  }

  getEngine():string {
    return this.engine;
  }

  async init(): Promise<void> {
    if (this.engine === "Dynamsoft") {
      this.reader = new DynamsoftBarcodeReader();
    }else if (this.engine === "ZBar") {
      this.reader = new ZBar();
    }
    else{
      this.reader = new ZXing();
    }
    await this.reader.init();
  }

  detect(image:ImageBitmapSource|string|HTMLImageElement|HTMLVideoElement): Promise<DetectionResult> {
    return this.reader.detect(image);
  }

  static getEngines():string[] {
    return ["Dynamsoft","ZXing","ZBar"];
  }
}

export interface DetectionResult {
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
