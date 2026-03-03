export interface AnnotationSyllableConnectorStruct {
  syllableID: string;
  noteID: string;
}

export interface AnnotationConnectionStruct {
  musicID: string;
  textID: string;
  syllableConnectors: AnnotationSyllableConnectorStruct[];
}

export interface AnnotationStruct {
  connections: AnnotationConnectionStruct[];
}
