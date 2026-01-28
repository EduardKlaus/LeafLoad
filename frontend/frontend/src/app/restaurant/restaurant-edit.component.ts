import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { environment } from '../../environments/environment';

type Region = { id: number; name: string };
type Category = { id: number; name: string };

type RestaurantEditData = {
  id: number;
  name: string;
  description: string | null;
  imageUrl: string | null;
  regionId: number | null;
  categories: Category[];
};

type EditField = 'description' | 'imageUrl' | 'regionId' | null;

@Component({
  selector: 'app-restaurant-edit',
  standalone: true,
  imports: [CommonModule, FormsModule, HttpClientModule, RouterModule],
  templateUrl: './restaurant-edit.html',
  styleUrls: ['./restaurant-edit.scss'],
})
export class RestaurantEditComponent implements OnInit {
  restaurant: RestaurantEditData | null = null;
  regions: Region[] = [];

  isLoading = false;
  error = '';

  editField: EditField = null;
  savingField: string | null = null;

  // edit buffers
  editDescription = '';
  editImageUrl = '';
  editRegionId: number | null = null;

  // categories UI
  newCategoryName = '';
  editingCategoryId: number | null = null;
  editCategoryName = '';
  savingCategoryId: number | null = null;

  private restaurantId!: number;

  constructor(private route: ActivatedRoute, private http: HttpClient) { }

  ngOnInit(): void {
    this.restaurantId = Number(this.route.snapshot.paramMap.get('id'));
    this.load();
  }

  load(): void {
    this.isLoading = true;
    this.error = '';

    this.http.get<RestaurantEditData>(`${environment.apiUrl}/api/restaurants/${this.restaurantId}/edit`).subscribe({
      next: (r) => {
        this.restaurant = r;
        this.editDescription = r.description ?? '';
        this.editImageUrl = r.imageUrl ?? '';
        this.editRegionId = r.regionId ?? null;
        this.isLoading = false;

        // regions parallel laden
        this.http.get<Region[]>(`${environment.apiUrl}/regions`).subscribe({
          next: (regs) => (this.regions = regs),
          error: () => { },
        });
      },
      error: (err) => {
        this.isLoading = false;
        this.error = err?.error?.message ?? 'Could not load restaurant.';
      },
    });
  }

  startEdit(field: Exclude<EditField, null>) {
    if (!this.restaurant) return;
    this.error = '';
    this.editField = field;

    if (field === 'description') this.editDescription = this.restaurant.description ?? '';
    if (field === 'imageUrl') this.editImageUrl = this.restaurant.imageUrl ?? '';
    if (field === 'regionId') this.editRegionId = this.restaurant.regionId ?? null;
  }

  cancelEdit() {
    this.error = '';
    this.editField = null;
    if (!this.restaurant) return;
    this.editDescription = this.restaurant.description ?? '';
    this.editImageUrl = this.restaurant.imageUrl ?? '';
    this.editRegionId = this.restaurant.regionId ?? null;
  }

  saveDescription() {
    this.patchRestaurant({ description: this.editDescription });
  }

  saveImageUrl() {
    // darf leer sein -> wir schicken String, backend akzeptiert
    this.patchRestaurant({ imageUrl: this.editImageUrl });
  }

  saveRegion() {
    this.patchRestaurant({ regionId: this.editRegionId });
  }

  private patchRestaurant(payload: any) {
    if (!this.restaurant) return;

    this.savingField = this.editField ?? 'restaurant';
    this.error = '';

    this.http.patch(`${environment.apiUrl}/api/restaurants/${this.restaurantId}`, payload).subscribe({
      next: (updated: any) => {
        // lokal updaten
        this.restaurant = {
          ...this.restaurant!,
          ...updated,
        };

        this.savingField = null;
        this.editField = null;
      },
      error: (err) => {
        this.savingField = null;
        this.error = err?.error?.message ?? 'Could not save changes.';
      },
    });
  }

  // --- Categories ---
  addCategory() {
    const name = this.newCategoryName.trim();
    if (!name) {
      this.error = 'Category name cannot be empty.';
      return;
    }

    this.savingField = 'addCategory';
    this.http.post<Category>(`${environment.apiUrl}/api/restaurants/${this.restaurantId}/categories`, { name }).subscribe({
      next: (cat) => {
        this.restaurant!.categories = [...this.restaurant!.categories, cat];
        this.newCategoryName = '';
        this.savingField = null;
      },
      error: (err) => {
        this.savingField = null;
        this.error = err?.error?.message ?? 'Could not add category.';
      },
    });
  }

  startEditCategory(cat: Category) {
    this.error = '';
    this.editingCategoryId = cat.id;
    this.editCategoryName = cat.name;
  }

  cancelEditCategory() {
    this.editingCategoryId = null;
    this.editCategoryName = '';
  }

  saveCategory(catId: number) {
    const name = this.editCategoryName.trim();
    if (!name) {
      this.error = 'Category name cannot be empty.';
      return;
    }

    this.savingCategoryId = catId;
    this.http.patch<Category>(`${environment.apiUrl}/api/restaurants/categories/${catId}`, { name }).subscribe({
      next: (updated) => {
        this.restaurant!.categories = this.restaurant!.categories.map((c) =>
          c.id === catId ? updated : c
        );
        this.savingCategoryId = null;
        this.editingCategoryId = null;
      },
      error: (err) => {
        this.savingCategoryId = null;
        this.error = err?.error?.message ?? 'Could not update category.';
      },
    });
  }

  deleteCategory(cat: Category) {
    const ok = window.confirm(
      `Delete category "${cat.name}"?\nItems will move to "Other".`
    );
    if (!ok) return;

    this.savingCategoryId = cat.id;
    this.http.delete(`${environment.apiUrl}/api/restaurants/categories/${cat.id}`).subscribe({
      next: () => {
        this.restaurant!.categories = this.restaurant!.categories.filter((c) => c.id !== cat.id);
        this.savingCategoryId = null;
      },
      error: (err) => {
        this.savingCategoryId = null;
        this.error = err?.error?.message ?? 'Could not delete category.';
      },
    });
  }

  getRegionName(regionId: number | null): string {
    if (regionId === null) return '—';
    const region = this.regions.find(r => r.id === regionId);
    return region?.name ?? '—';
  }
}
