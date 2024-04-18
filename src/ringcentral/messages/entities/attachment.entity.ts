export enum Type {
    AudioRecording = "AudioRecording",
    AudioTranscription = "AudioTranscription",
    Text = "Text",
    SourceDocument = "SourceDocument",
    RenderedDocument = "RenderedDocument",
    MmsAttachment = "MmsAttachment"
}

export enum AttachmentsType{
    Image = "Image",
    Audio = "Audio",
    Video = "Video",
    File = "File",
}


export class Attachments {
    id: Number;
    uri: string;
    type: Type;
    contentType: string;

    route?: string;
    recordUrl?: string;
    filename?: string;
    duration?: Number;
    fileType?: AttachmentsType;
    createdAt?: Date;
    base64?: string;
    name?: string;
}