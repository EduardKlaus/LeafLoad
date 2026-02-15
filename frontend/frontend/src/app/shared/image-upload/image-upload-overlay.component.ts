import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { environment } from '../../../environments/environment';

@Component({
    selector: 'app-image-upload-overlay',
    standalone: true,
    imports: [CommonModule, HttpClientModule],
    templateUrl: './image-upload-overlay.component.html',
    styleUrls: ['./image-upload-overlay.component.scss']
})
export class ImageUploadOverlayComponent {
    // emits when overlay should be closed
    @Output() closed = new EventEmitter<void>();
    // emits "assets/uploads/<filename>" or "/api/uploads/serve/..."
    @Output() uploaded = new EventEmitter<string>();

    isDragging = false;
    uploading = false;
    error = '';

    constructor(private http: HttpClient) { }

    // closes overlay if no upload is currently running
    close() {
        if (!this.uploading) this.closed.emit();
    }

    // drag and drop event handlers (prevent default browser behavior and update drag state)
    onDragEnter(e: DragEvent) { e.preventDefault(); this.isDragging = true; }
    onDragOver(e: DragEvent) { e.preventDefault(); this.isDragging = true; }
    onDragLeave(e: DragEvent) { e.preventDefault(); this.isDragging = false; }

    // handle file drop (extracts first file from dataTransfer and triggers upload)
    onDrop(e: DragEvent) {
        e.preventDefault();
        this.isDragging = false;
        const file = e.dataTransfer?.files?.[0];
        if (file) this.upload(file);
    }

    // handles manual file selection
    onPick(e: Event) {
        const input = e.target as HTMLInputElement;
        const file = input.files?.[0];
        input.value = '';
        if (file) this.upload(file);
    }

    // uploads the given file (validates type, creates FormData, sends POST request)
    private upload(file: File) {
        this.error = '';

        if (!file.type.startsWith('image/')) {
            this.error = 'Bitte nur Bild-Dateien hochladen.';
            return;
        }

        const form = new FormData();
        form.append('file', file);

        this.uploading = true;
        this.http.post<{ path: string }>(`${environment.apiUrl}/uploads/image`, form).subscribe({
            next: (res) => {
                this.uploading = false;
                // Backend returns: { path: "/api/uploads/serve/..." }
                // We emit this directly so it can be used as src
                this.uploaded.emit(res.path);
            },
            error: (err) => {
                this.uploading = false;
                console.error(err);
                this.error = err?.error?.message ?? 'Upload fehlgeschlagen.';
            }
        });
    }
}
