import { CameraEnhancer, DCEFrame } from "dynamsoft-camera-enhancer";
import { DetectionResult } from "./BarcodeReader";

export default class HTTPBarcodeReader {
  private settings:any;
  private canvas!:HTMLCanvasElement;
  private engine:string = "";
  async init() : Promise<void> {
    if (!this.canvas) {
      this.canvas = document.createElement("canvas");
    }
  }

  setEngine(engine:string) {
    this.engine = engine;
  }

  getEngine() {
    return this.engine;
  }

  async detect(image: ImageBitmapSource|string|HTMLImageElement|HTMLVideoElement|DCEFrame) : Promise<DetectionResult> {
    let base64 = "";
    if (typeof(image) === "string") {
      base64 = this.removeDataURLHead(image);
    }
    if (image instanceof HTMLCanvasElement) {
      base64 = this.getBase64FromCanvas(image);
    } else if (CameraEnhancer.isDCEFrame(image)) {
      base64 = this.getBase64FromCanvas((image as DCEFrame).toCanvas());
    } else if (image instanceof HTMLImageElement) {
      base64 = this.getBase64FromImage(image as HTMLImageElement);
    } else if (image instanceof HTMLVideoElement) {
      base64 = this.getBase64FromVideo(image as HTMLVideoElement);
    }
    let results = await this.fetchDetectionResults(base64);
    return results;
  }

  fetchDetectionResults(base64:string):Promise<DetectionResult>{
    let pThis = this;
    return new Promise(function(resolve,reject){
      let payload = {engine:pThis.engine,base64:base64};
      let xhr = new XMLHttpRequest();
      xhr.open('POST', '/readBarcodes');
      xhr.setRequestHeader('content-type', 'application/json'); 
      xhr.onreadystatechange = function(){
        if(xhr.readyState === 4){
          console.log(xhr.responseText);
          let response:DetectionResult = JSON.parse(xhr.responseText);
          resolve(response);
        }
      }
      xhr.onerror = function(){
        console.log("error");
        reject("error");
      }
      console.log(payload);
      xhr.send(JSON.stringify(payload));
    })
  }

  drawImageOrVideo(source:HTMLImageElement|HTMLVideoElement){
    let ctx = this.canvas.getContext("2d");
    if (source instanceof HTMLImageElement) { 
      this.canvas.width = source.naturalWidth;
      this.canvas.height = source.naturalHeight;
    }else if (source instanceof HTMLVideoElement) {
      this.canvas.width = source.videoWidth;
      this.canvas.height = source.videoHeight;
    }
    ctx?.drawImage(source, 0, 0, this.canvas.width, this.canvas.height);
  }

  getBase64FromVideo(image:HTMLVideoElement){
    this.drawImageOrVideo(image);
    return this.getBase64FromCanvas(this.canvas);
  }

  getBase64FromImage(image:HTMLImageElement){
    this.drawImageOrVideo(image);
    return this.getBase64FromCanvas(this.canvas);
  }

  getBase64FromCanvas(canvas:HTMLCanvasElement){
    return this.removeDataURLHead(canvas.toDataURL("image/jpeg")); //use jpeg for better compression
  }

  removeDataURLHead(dataURL:string){
    return dataURL.substring(dataURL.indexOf(",")+1,dataURL.length);
  }

  getSupportedSettings():string[] {
    return [];
  }

  async setSupportedSettings(settings:any):Promise<void> {
    this.settings = settings;
  }
}