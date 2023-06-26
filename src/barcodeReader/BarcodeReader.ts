import { DCEFrame } from "dynamsoft-camera-enhancer";
import DynamsoftBarcodeReader from "./DynamsoftBarcodeReader";
import ZBar from "./ZBar";
import ZXing from "./ZXing";
import HTTPBarcodeReader from "./HTTPBarcodeReader";

export class BarcodeReader {
  private engine = "Dynamsoft";
  private reader!: DynamsoftBarcodeReader|ZXing|ZBar|HTTPBarcodeReader;
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
    }else if (this.engine === "ZXing"){
      this.reader = new ZXing();
    }else{
      this.reader = new HTTPBarcodeReader();
    }
    await this.reader.init();
  }

  detect(image:ImageBitmapSource|string|HTMLImageElement|HTMLVideoElement|DCEFrame): Promise<DetectionResult> {
    return this.reader.detect(image);
  }

  static getEngines():string[] {
    return ["Dynamsoft","ZXing","ZBar","HTTPBarcodeReader"];
  }

  static getSupportedSettings(engine:string):SettingDef[] {
    if (engine === "Dynamsoft") {
      return DynamsoftBarcodeReader.getSupportedSettings();
    }else if (engine === "ZBar") {
      return ZBar.getSupportedSettings();
    }else if (engine === "ZXing"){
      return ZXing.getSupportedSettings();
    }else{
      return HTTPBarcodeReader.getSupportedSettings();
    }
  }

  static getDefaultSettings(engine:string):any {
    if (engine === "Dynamsoft") {
      return DynamsoftBarcodeReader.getDefaultSettings();
    }else if (engine === "ZBar") {
      return ZBar.getDefaultSettings();
    }else if (engine === "ZXing"){
      return ZXing.getDefaultSettings();
    }else{
      return HTTPBarcodeReader.getDefaultSettings();
    }
  }

  static async getSettingOptions(engine:string,key:string,settings:Setting[]):Promise<string[]> {
    if (engine === "Dynamsoft") {
      return DynamsoftBarcodeReader.getSettingOptions(key,settings);
    }else if (engine === "ZBar") {
      return ZBar.getSettingOptions(key,settings);
    }else if (engine === "ZXing"){
      return ZXing.getSettingOptions(key,settings);
    }else{
      const options = await HTTPBarcodeReader.getSettingOptions(key,settings);
      return options;
    }
  }

  async setSupportedSettings(settings:Setting[]):Promise<void> {
    return this.reader.setSettings(settings);
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

export interface BarcodeReaderConfig {
  engine:string;
  displayName:string;
  color?:string;
  settings:Setting[];
}

export interface Setting {
  name:string;
  value:string;
  type?:"string"|"select";
}

export interface SettingDef {
  name: string;
  type:"string"|"select";
}
