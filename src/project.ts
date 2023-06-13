export class Project {
  info:ProjectInfo;
  isRemote = false;
  constructor(info:ProjectInfo,isRemote?:boolean){
    this.info = info;
    if (isRemote) {
      this.isRemote = isRemote;
    }
  }
}

export interface ProjectInfo {
  name:string;
  creationTimestamp:number;
  images:string[];
}

export interface ProjectSettings {
  enabledEngines:string[];
}
