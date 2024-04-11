export enum Type {
    AudioRecording = "AudioRecording",
    AudioTranscription = "AudioTranscription",
    Text = "Text",
    SourceDocument = "SourceDocument",
    RenderedDocument = "RenderedDocument",
    MmsAttachment = "MmsAttachment"
}

export enum AttachmentsTypep{
    Image = "Image",
    Audio = "Audio",
    Video = "Video",
    File = "File",
}


export class Attachments {
    id: Number;
    uri: String;
    type: Type;
    contentType: String;

    recordUrl?: String;
    filename?: String;
    duration?: Number;
    fileType?: AttachmentsTypep;
    createrAt?: Date;
}