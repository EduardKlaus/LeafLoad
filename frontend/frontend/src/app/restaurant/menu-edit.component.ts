import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';

type Category = { id: number; name: string };

import { ImageUploadOverlayComponent } from '../shared/image-upload/image-upload-overlay.component';

@Component({
  selector: 'app-menu-item-edit',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, ImageUploadOverlayComponent],
  templateUrl: './menu-edit.html',
  styleUrls: ['./menu-edit.scss'],
})
export class MenuItemEditComponent implements OnInit {
  item: any = null;
  categories: Category[] = [];

  isLoading = false;
  error = '';
  isCreateMode = false;

  editField: 'title' | 'description' | 'imageUrl' | 'categoryId' | 'price' | null = null;
  saving = false;

  editTitle = '';
  editDescription = '';
  editImageUrl = '';
  editCategoryId: number | null = null;
  editPrice = 0;

  showImageOverlay = false;

  private itemId: number | null = null;
  private restaurantId: number | null = null;

  // opens the image upload overlay
  openImageOverlay() {
    this.error = '';
    this.showImageOverlay = true;
  }

  // handles the uploaded image
  onItemImageUploaded(path: string) {
    this.showImageOverlay = false;
    if (this.isCreateMode) {
      this.editImageUrl = path;
    } else {
      this.saving = true;
      this.http.patch<any>(`${environment.apiUrl}/restaurants/menu-items/${this.itemId}`, { imageUrl: path }).subscribe({
        next: (updated) => {
          this.item = { ...this.item, ...updated };
          this.editImageUrl = path;
          this.saving = false;
        },
        error: (err) => {
          this.saving = false;
          this.error = err?.error?.message ?? 'Could not save image.';
        },
      });
    }
  }

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private http: HttpClient
  ) { }

  ngOnInit(): void {
    const idParam = this.route.snapshot.paramMap.get('id');

    if (idParam) {
      // Edit mode
      this.itemId = Number(idParam);
      this.isCreateMode = false;
      this.load();
    } else {
      // Create mode
      this.isCreateMode = true;
      this.restaurantId = Number(this.route.snapshot.queryParamMap.get('restaurantId'));
      this.editCategoryId = Number(this.route.snapshot.queryParamMap.get('categoryId')) || null;
      this.loadCategoriesForCreate();
    }
  }

  // loads the full menu item data for editing (also extracts restaurant categories for selection)
  load(): void {
    this.isLoading = true;
    this.error = '';

    this.http.get<any>(`${environment.apiUrl}/restaurants/menu-items/${this.itemId}/edit`).subscribe({
      next: (res) => {
        this.item = res;
        this.categories = res.restaurant?.categories ?? [];
        this.restaurantId = res.restaurantId;

        this.editTitle = res.title ?? '';
        this.editDescription = res.description ?? '';
        this.editImageUrl = res.imageUrl ?? '';
        this.editCategoryId = res.categoryId ?? null;
        this.editPrice = res.price ?? 0;

        this.isLoading = false;
      },
      error: (err) => {
        this.isLoading = false;
        this.error = err?.error?.message ?? 'Could not load item.';
      },
    });
  }

  // loads restaurant categories only
  loadCategoriesForCreate(): void {
    if (!this.restaurantId) return;

    this.isLoading = true;
    this.http.get<any>(`${environment.apiUrl}/restaurants/${this.restaurantId}/details`).subscribe({
      next: (res) => {
        this.categories = res.restaurant?.categories ?? [];
        this.isLoading = false;
      },
      error: () => {
        this.isLoading = false;
      },
    });
  }

  // activates inline editing for a field
  startEdit(field: 'title' | 'description' | 'imageUrl' | 'categoryId' | 'price') {
    this.error = '';
    this.editField = field;
  }

  // cancels inline editing
  cancelEdit() {
    this.error = '';
    this.editField = null;

    if (!this.item) return;
    this.editTitle = this.item.title ?? '';
    this.editDescription = this.item.description ?? '';
    this.editImageUrl = this.item.imageUrl ?? '';
    this.editCategoryId = this.item.categoryId ?? null;
    this.editPrice = this.item.price ?? 0;
  }

  // saves the changes for the current field
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
    if (this.editField === 'price') payload.price = this.editPrice;

    this.saving = true;
    this.http.patch<any>(`${environment.apiUrl}/restaurants/menu-items/${this.itemId}`, payload).subscribe({
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

  // creates a new menu item
  createItem() {
    if (!this.editTitle.trim()) {
      this.error = 'Dish name cannot be empty.';
      return;
    }
    if (this.editPrice <= 0) {
      this.error = 'Price must be greater than 0.';
      return;
    }

    const payload = {
      restaurantId: this.restaurantId,
      title: this.editTitle,
      description: this.editDescription,
      imageUrl: this.editImageUrl,
      categoryId: this.editCategoryId,
      price: this.editPrice,
    };

    this.saving = true;
    this.http.post<any>(`${environment.apiUrl}/restaurants/menu-items`, payload).subscribe({
      next: () => {
        this.saving = false;
        this.router.navigate(['/restaurants', this.restaurantId]);
      },
      error: (err) => {
        this.saving = false;
        this.error = err?.error?.message ?? 'Could not create item.';
      },
    });
  }

  // gets the category name for a given category id
  getCategoryName(categoryId: number | null): string {
    if (categoryId === null) return 'Other';
    const category = this.categories.find(c => c.id === categoryId);
    return category?.name ?? 'Other';
  }
}
