import { Component, ViewEncapsulation } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class AppComponent {
  query = '';
  recommendations: any[] = [];
  isSuggestionListActive = false;
  selectedCity: string = '';
  selectedState: string = '';
  isButtonHidden = true;
  isCityDetailsPopupOpen = false;
  cityPopulation: number = 0;
  cityLatitude: number = 0;
  cityLongitude: number = 0;

  constructor(private http: HttpClient) { }

  // Function to search cities based on the query
  searchCities() {
    if (this.query) {
      console.log('Performing city search with query:', this.query);

      this.http.get<any[]>('http://localhost:3000/cities/search', { params: { q: this.query } }).subscribe(
        (response) => {
          // Search successful, assign results to recommendations array
          console.log('Search results:', response);
          this.recommendations = response;
          this.isSuggestionListActive = this.recommendations.length > 0;
        },
        (error) => {
          // Handle error during search
          console.error('Error occurred while searching for cities:', error);
          this.recommendations = []; // Reset recommendations array
          this.isSuggestionListActive = false;
        }
      );
    } else {
      // Empty query, reset recommendations array
      console.log('Empty query. Resetting recommendations array.');
      this.recommendations = [];
      this.isSuggestionListActive = false;
    }
  }

  toggleButtonVisibility() {
    this.isButtonHidden = !this.query || this.isSuggestionListActive;
    // Hide button if query is empty or suggestion list is active
  }

  selectCity(cityName: string, stateName: string) {
    this.query = cityName;
    this.selectedCity = cityName;
    this.selectedState = stateName;
    this.isSuggestionListActive = false;
    this.toggleButtonVisibility();
  }

  openCityDetailsPopup() {
    // Simulate fetching city details from backend using the selectedCity and selectedState values
    // Replace the API endpoint and parameters with your actual backend implementation
    this.http.get<any>('http://localhost:3000/cities/details', { params: { city: this.selectedCity, state: this.selectedState } }).subscribe(
      (response) => {
        // Fetch successful, assign city details
        console.log('City details:', response);
        this.cityPopulation = response.population;
        this.cityLatitude = response.latitude;
        this.cityLongitude = response.longitude;
        this.isCityDetailsPopupOpen = true;
      },
      (error) => {
        // Handle error during fetching city details
        console.error('Error occurred while fetching city details:', error);
      }
    );
  }

  closeCityDetailsPopup() {
    this.isCityDetailsPopupOpen = false;
  }

  goToCity() {
    // Handle the action when the user clicks the "GO" button
    console.log('Navigating to city:', this.selectedCity, ', state:', this.selectedState);
    this.openCityDetailsPopup();
  }

  openMap() {
    // Handle the action when the user clicks the "GO" button
    console.log('Navigating to city:', this.selectedCity, ', state:', this.selectedState);
    window.open(`https://www.google.com/maps/search/?api=1&query=${this.selectedCity},${this.selectedState}`, '_blank');
  }
}
