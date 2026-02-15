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
    @Output() closed = new EventEmitter<void>();
    @Output() uploaded = new EventEmitter<string>(); // emits "assets/uploads/<filename>" or "/api/uploads/serve/..."

    isDragging = false;
    uploading = false;
    error = '';

    constructor(private http: HttpClient) { }

    close() {
        if (!this.uploading) this.closed.emit();
    }

    onDragEnter(e: DragEvent) { e.preventDefault(); this.isDragging = true; }
    onDragOver(e: DragEvent) { e.preventDefault(); this.isDragging = true; }
    onDragLeave(e: DragEvent) { e.preventDefault(); this.isDragging = false; }

    onDrop(e: DragEvent) {
        e.preventDefault();
        this.isDragging = false;
        const file = e.dataTransfer?.files?.[0];
        if (file) this.upload(file);
    }

    onPick(e: Event) {
        const input = e.target as HTMLInputElement;
        const file = input.files?.[0];
        input.value = '';
        if (file) this.upload(file);
    }

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
