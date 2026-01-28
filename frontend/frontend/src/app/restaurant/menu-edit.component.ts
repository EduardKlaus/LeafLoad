import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { HttpClient, HttpClientModule } from '@angular/common/http';

type Category = { id: number; name: string };

@Component({
  selector: 'app-menu-item-edit',
  standalone: true,
  imports: [CommonModule, FormsModule, HttpClientModule, RouterModule],
  templateUrl: './menu-edit.html',
  styleUrls: ['./menu-edit.scss'],
})
export class MenuItemEditComponent implements OnInit {
  item: any = null;
  categories: Category[] = [];

  isLoading = false;
  error = '';

  editField: 'title' | 'description' | 'imageUrl' | 'categoryId' | null = null;
  saving = false;

  editTitle = '';
  editDescription = '';
  editImageUrl = '';
  editCategoryId: number | null = null;

  private itemId!: number;

  constructor(private route: ActivatedRoute, private http: HttpClient) {}

  ngOnInit(): void {
    this.itemId = Number(this.route.snapshot.paramMap.get('id'));
    this.load();
  }

  load(): void {
    this.isLoading = true;
    this.error = '';

    this.http.get<any>(`/restaurants/menu-items/${this.itemId}/edit`).subscribe({
      next: (res) => {
        this.item = res;
        this.categories = res.restaurant?.categories ?? [];

        this.editTitle = res.title ?? '';
        this.editDescription = res.description ?? '';
        this.editImageUrl = res.imageUrl ?? '';
        this.editCategoryId = res.categoryId ?? null;

        this.isLoading = false;
      },
      error: (err) => {
        this.isLoading = false;
        this.error = err?.error?.message ?? 'Could not load item.';
      },
    });
  }

  startEdit(field: 'title' | 'description' | 'imageUrl' | 'categoryId') {
    this.error = '';
    this.editField = field;
  }

  cancelEdit() {
    this.error = '';
    this.editField = null;

    if (!this.item) return;
    this.editTitle = this.item.title ?? '';
    this.editDescription = this.item.description ?? '';
    this.editImageUrl = this.item.imageUrl ?? '';
    this.editCategoryId = this.item.categoryId ?? null;
  }

  save() {
    if (!this.item) return;

    if (this.editField === 'title' && !this.editTitle.trim()) {
      this.error = 'Dish name cannot be empty.';
      return;
    }

    const payload: any = {};
    if (this.editField === 'title') payload.title = this.editTitle;
    if (this.editField === 'description') payload.description = this.editDescription; // can be empty
    if (this.editField === 'imageUrl') payload.imageUrl = this.editImageUrl; // can be empty
    if (this.editField === 'categoryId') payload.categoryId = this.editCategoryId; // can be null -> Other

    this.saving = true;
    this.http.patch<any>(`/restaurants/menu-items/${this.itemId}`, payload).subscribe({
      next: (updated) => {
        this.item = { ...this.item, ...updated };
        this.saving = false;
        this.editField = null;
      },
      error: (err) => {
        this.saving = false;
        this.error = err?.error?.message ?? 'Could not save changes.';
      },
    });
  }
}
