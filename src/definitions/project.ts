export class Project {
  info:ProjectInfo;
  constructor(info:ProjectInfo){
    this.info = info;
  }
}

export interface ProjectInfo {
  name:string;
  creationTimestamp:number;
  images:string[];
}