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
    attachmentId?: String;
    uri?: String;
    recordUrl: String;
    filename: String;
    duration?: Number;
    type: Type;
    contentType: String;
    fileType: AttachmentsTypep;
    createrAt: Date;
}