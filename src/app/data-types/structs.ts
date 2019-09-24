export interface AnnotationSyllableConnectorStruct {
  syllableID: string;
  noteID: string;
}

export interface AnnotationConnectionStruct {
  musicID: string;
  textID: string;
  syllableConnectors: Array<AnnotationSyllableConnectorStruct>;
}

export interface AnnotationStruct {
  connections: Array<AnnotationConnectionStruct>;
}
