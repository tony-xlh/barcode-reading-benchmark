# Barcode Reading Benchmark

A barcode reading benchmark tool based on Quasar + Vue. It can create barcode reading benchmark projects which save the test results and images in indexedDB. The benchmark can run purely in the browser.

The following SDKs are included for testing:

* [Dynamsoft Barcode Reader JavaScript Edition](https://www.dynamsoft.com/barcode-reader/sdk-javascript/)
* [ZBar.wasm](https://github.com/undecaf/zbar-wasm)
* [ZXing-js](https://github.com/zxing-js/library)

Extra SDKs are supported via HTTP using [Barcode-Reader-Aggregator](https://github.com/tony-xlh/Barcode-Reader-Aggregator).

[Online demo](https://tony-xlh.github.io/barcode-dataset/benchmark/)

## Features

* Run batch barcode decoding on an image dataset
* Calculate metrics like reading rate, precision and average time
* Compare the performance of different barcode reading libraries
* Export and import of benchmark projects

## How the Metrics are Calculated

* Reading rate: `correctly detected barcodes / total barcodes`
* Precision: `incorrectly detected barcodes / all detected barcodes`
* Average time: `total time elapsed / total files`

## How to Infer that a Barcode is Correctly Detected

1. Check if there is a ground truth barcode which overlaps with the detected barcode using IoU (intersection of union).
2. Check if the barcode text is correct. If the barcode content is in raw bytes, compare the binaries. Since 2D barcodes use Reed–Solomon error correction, it is okay if some of the binaries do not match with the ground truth's (based on edit distance).

## Dive into Formats

* Barcode Detection Result
   
   ```ts
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
   ```
   
   Barcode detection result is saved in the above format in JSON with the `.json` extension.

* Ground Truth

   ```ts
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
   ```
   
   Ground truth is saved in the above format in JSON with the `.txt` extension.

* Remote Projects

   Put the files like the following example to the dataset folder as remote projects. Users can download them to check them out locally. The files can be retrieved using the export feature.

   ```
   │  projects.json
   │
   │─ Project
           detection_result_filenames.json
           project_manifest.json
           results.zip
           [P]ISBN_18_0010.jpg
           [P]ISBN_18_0077.jpg
   ```

## How to run the app

### Install the dependencies

```bash
yarn
# or
npm install
```

### Start the app in development mode (hot-code reloading, error reporting, etc.)
```bash
quasar dev
```


### Build the app for production
```bash
quasar build
```

### Customize the configuration
See [Configuring quasar.config.js](https://v2.quasar.dev/quasar-cli-vite/quasar-config-js).
