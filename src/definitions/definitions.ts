export interface GroundTruth {
  text:string;
  x1:number;
  x2:number;
  x3:number;
  x4:number;
  y1:number;
  y2:number;
  y3:number;
  y4:number;
  attrib:Attrib;
  value_attrib:ValueAttrib;
}

export interface Attrib {
  Type:string;
}

export interface ValueAttrib {
  Mode?:string;
}

export interface Point {
  x:number;
  y:number;
}

export interface Rect {
  left:number;
  right:number;
  top:number;
  bottom:number;
  width:number;
  height:number;
}

export interface DetectionStatistics {
  groundTruth: number;
  detected: number;
  correct: number;
  misdetected: number;
}

export interface PerformanceMetrics {
  fileNumber: number;
  correctFilesNumber:number;
  barcodeNumber: number;
  accuracy:number;
  precision:number;
  averageTime:number;
}

export interface EngineStatistics {
  name: string;
  metrics: PerformanceMetrics;
  rows?:EngineDataTableRow[];
}

export interface EngineDataTableRow {
  number: number;
  filename: string;
  groundTruth: string;
  detectedText: string;
  time: string;
  barcodeFormat: string;
  correct: string;
  misdetected: string;
}
