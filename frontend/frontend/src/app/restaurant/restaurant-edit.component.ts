import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { Subject, takeUntil, combineLatest, map, filter, distinctUntilChanged, finalize } from 'rxjs';
import { AuthService } from '../auth/auth.service';
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

// editable fields
type EditField = 'description' | 'imageUrl' | 'regionId' | null;

import { ImageUploadOverlayComponent } from '../shared/image-upload/image-upload-overlay.component';

@Component({
  selector: 'app-restaurant-edit',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, ImageUploadOverlayComponent],
  templateUrl: './restaurant-edit.html',
  styleUrls: ['./restaurant-edit.scss'],
})
export class RestaurantEditComponent implements OnInit, OnDestroy {
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

  showImageOverlay = false;

  restaurantId!: number;
  private destroy$ = new Subject<void>();

  openImageOverlay() {
    this.error = '';
    this.showImageOverlay = true;
  }

  onRestaurantImageUploaded(path: string) {
    this.showImageOverlay = false;
    this.patchRestaurant({ imageUrl: path });
  }

  constructor(
    private route: ActivatedRoute,
    private http: HttpClient,
    private auth: AuthService,
    private cdr: ChangeDetectorRef
  ) { }


  ngOnInit(): void {
    this.isLoading = true; // Start loading immediately

    combineLatest([
      this.route.paramMap,
      this.auth.authReady$,
      this.auth.state$
    ]).pipe(
      filter(([_, ready]) => ready),
      map(([params, , state]) => ({ params, state })),
      filter(({ state }) => state.isLoggedIn && state.role === 'RESTAURANT_OWNER' && !!state.restaurantId),
      distinctUntilChanged((a, b) =>
        a.params.get('id') === b.params.get('id') &&
        a.state.userId === b.state.userId &&
        a.state.restaurantId === b.state.restaurantId
      ),
      takeUntil(this.destroy$)
    ).subscribe(({ params, state }) => {
      const routeId = Number(params.get('id')); // 0 or NaN if missing
      const userRestaurantId = state.restaurantId!;

      // Optional: Check if route ID matches user's restaurant ID
      // If the user can ONLY edit their own restaurant, we should probably enforce this or redirect
      // For now, we load what's in the route, assuming backend checks permission too.
      this.restaurantId = routeId || userRestaurantId;

      // Update to ensure we are editing the correct restaurant
      if (this.restaurantId) {
        this.load();
      } else {
        this.error = 'No restaurant to edit.';
        this.isLoading = false;
      }
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // loads the restaurant data from backend
  load(): void {
    this.isLoading = true;
    this.error = '';
    this.restaurant = null; // <--- Clear stale data

    this.http.get<RestaurantEditData>(`${environment.apiUrl}/restaurants/${this.restaurantId}/edit`).subscribe({
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

    this.http.patch(`${environment.apiUrl}/restaurants/${this.restaurantId}`, payload)
      .pipe(finalize(() => {
        this.savingField = null;
        this.cdr.detectChanges();
      }))
      .subscribe({
        next: (updated: any) => {
          // lokal updaten
          this.restaurant = {
            ...this.restaurant!,
            ...updated,
          };
          this.editField = null;
        },
        error: (err) => {
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
    this.http.post<Category>(`${environment.apiUrl}/restaurants/${this.restaurantId}/categories`, { name }).subscribe({
      next: (cat) => {
        this.restaurant!.categories = [...this.restaurant!.categories, cat];
        this.newCategoryName = '';
        this.savingField = null;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.savingField = null;
        this.error = err?.error?.message ?? 'Could not add category.';
        this.cdr.detectChanges();
      },
    });
  }

  startEditCategory(cat: Category) {
    this.error = '';
    this.editingCategoryId = cat.id;
    this.editCategoryName = cat.name;
    this.cdr.detectChanges();
  }

  cancelEditCategory() {
    this.editingCategoryId = null;
    this.editCategoryName = '';
    this.cdr.detectChanges();
  }

  saveCategory(catId: number) {
    const name = this.editCategoryName.trim();
    if (!name) {
      this.error = 'Category name cannot be empty.';
      return;
    }

    this.savingCategoryId = catId;
    this.http.patch<Category>(`${environment.apiUrl}/restaurants/categories/${catId}`, { name }).subscribe({
      next: (updated) => {
        this.restaurant!.categories = this.restaurant!.categories.map((c) =>
          c.id === catId ? updated : c
        );
        this.savingCategoryId = null;
        this.editingCategoryId = null;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.savingCategoryId = null;
        this.error = err?.error?.message ?? 'Could not update category.';
        this.cdr.detectChanges();
      },
    });
  }

  deleteCategory(cat: Category) {
    const ok = window.confirm(
      `Delete category "${cat.name}"?\nItems will move to "Other".`
    );
    if (!ok) return;

    this.savingCategoryId = cat.id;
    this.http.delete(`${environment.apiUrl}/restaurants/categories/${cat.id}`).subscribe({
      next: () => {
        this.restaurant!.categories = this.restaurant!.categories.filter((c) => c.id !== cat.id);
        this.savingCategoryId = null;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.savingCategoryId = null;
        this.error = err?.error?.message ?? 'Could not delete category.';
        this.cdr.detectChanges();
      },
    });
  }

  getRegionName(regionId: number | null): string {
    if (regionId === null) return '—';
    const region = this.regions.find(r => r.id === regionId);
    return region?.name ?? '—';
  }
}
