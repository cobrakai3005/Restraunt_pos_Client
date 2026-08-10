// components/ui/combined-address-picker.tsx
"use client";

import React, { useEffect, useState, useRef } from "react";
import { useLoadScript } from "@react-google-maps/api";
import { Input } from "@/components/ui/input";
import { Loader2, MapPin } from "lucide-react";
import { cn } from "@/lib/utils";

const libraries: ("places")[] = ["places"];

interface CombinedAddressPickerProps {
  value: string;
  onChange: (fullAddress: string, city: string, state: string, pincode: string, lat?: number, lng?: number) => void;
  placeholder: string;
  label?: string;
  className?: string;
  disabled?: boolean;
}

export function CombinedAddressPicker(props: CombinedAddressPickerProps) {
  const googleMapsApiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "";
  const googlePlacesEnabled =
    process.env.NEXT_PUBLIC_ENABLE_GOOGLE_PLACES === "true" && Boolean(googleMapsApiKey);

  if (!googlePlacesEnabled) {
    return <ManualCombinedAddressPicker {...props} />;
  }

  return <GoogleCombinedAddressPicker {...props} />;
}

function ManualCombinedAddressPicker({
  value,
  onChange,
  placeholder,
  label,
  className,
  disabled,
}: CombinedAddressPickerProps) {
  const [searchValue, setSearchValue] = useState(value);

  useEffect(() => {
    setSearchValue(value);
  }, [value]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setSearchValue(newValue);
    onChange(newValue, "", "", "");
  };

  return (
    <div className={cn("space-y-2", className)}>
      {label && (
        <label className="text-sm font-medium leading-none">
          {label}
        </label>
      )}
      <div className="relative">
        <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={searchValue}
          onChange={handleInputChange}
          placeholder={placeholder}
          disabled={disabled}
          className="pl-9 pr-10 "
          autoComplete="off"
        />
      </div>
    </div>
  );
}

function GoogleCombinedAddressPicker({
  value,
  onChange,
  placeholder,
  label,
  className,
  disabled,
}: CombinedAddressPickerProps) {
  const [searchValue, setSearchValue] = useState(value);
  const [isLoading, setIsLoading] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isInputFocused, setIsInputFocused] = useState(false);
  const [predictions, setPredictions] = useState<google.maps.places.AutocompletePrediction[]>([]);
  const [mapsUnavailable, setMapsUnavailable] = useState(false);
  const googleMapsApiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "";

  const { isLoaded: isScriptReady, loadError } = useLoadScript({
    id: "google-maps-script",
    googleMapsApiKey,
    libraries,
  });

  // When a user picks a suggestion we don't want the "value" update to immediately
  // trigger another autocomplete fetch (which reopens the dropdown with other places).
  // This ref skips the next search cycle that is caused by programmatic value changes.
  const skipNextFetchRef = useRef(false);

  const inputRef = useRef<HTMLInputElement | null>(null);
  const autocompleteServiceRef = useRef<google.maps.places.AutocompleteService | null>(null);
  const placesServiceRef = useRef<google.maps.places.PlacesService | null>(null);

  useEffect(() => {
    setSearchValue(value);
  }, [value]);

  useEffect(() => {
    if (loadError) {
      setMapsUnavailable(true);
    }
  }, [loadError]);

  useEffect(() => {
    if (!isScriptReady || mapsUnavailable || typeof window === "undefined" || !window.google) return;
    if (!autocompleteServiceRef.current) {
      autocompleteServiceRef.current = new google.maps.places.AutocompleteService();
    }
    if (!placesServiceRef.current) {
      placesServiceRef.current = new google.maps.places.PlacesService(document.createElement("div"));
    }
  }, [isScriptReady, mapsUnavailable]);

  const extractAddressComponents = (place: google.maps.places.PlaceResult) => {
    let streetAddress = "";
    let city = "";
    let state = "";
    let pincode = "";

    // Get formatted address
    const fullAddress = place.formatted_address || "";

    if (place.address_components) {
      for (const component of place.address_components) {
        const types = component.types;
        
        // Build street address (house number + road/route)
        if (types.includes("street_number") || types.includes("route")) {
          streetAddress = streetAddress ? `${streetAddress}, ${component.long_name}` : component.long_name;
        }
        
        if (types.includes("locality") || types.includes("sublocality")) {
          city = component.long_name;
        }
        
        if (types.includes("administrative_area_level_1")) {
          state = component.long_name;
        }
        
        if (types.includes("postal_code")) {
          pincode = component.long_name;
        }
      }
    }

    // If we have separate components, create formatted address
    const formattedAddress = streetAddress ? 
      `${streetAddress}, ${city}, ${state} - ${pincode}`.replace(/\s+,/g, ',') : 
      fullAddress;

    return { 
      fullAddress: formattedAddress, 
      city, 
      state, 
      pincode 
    };
  };

  useEffect(() => {
    if (skipNextFetchRef.current) {
      // Skip the fetch triggered by programmatic value updates after selection
      skipNextFetchRef.current = false;
      return;
    }

    if (mapsUnavailable || !isScriptReady || !autocompleteServiceRef.current) return;
    if (!isInputFocused) {
      setShowSuggestions(false);
      return;
    }
    if (searchValue.trim().length < 2) {
      setPredictions([]);
      setShowSuggestions(false);
      return;
    }

    setIsSearching(true);
    const handle = setTimeout(() => {
      autocompleteServiceRef.current?.getPlacePredictions(
        {
          input: searchValue,
          componentRestrictions: { country: "in" },
        },
        (res, status) => {
          setIsSearching(false);
          if (status === google.maps.places.PlacesServiceStatus.OK && Array.isArray(res)) {
            setPredictions(res);
            setShowSuggestions(true);
          } else {
            if (
              status === google.maps.places.PlacesServiceStatus.REQUEST_DENIED ||
              status === google.maps.places.PlacesServiceStatus.UNKNOWN_ERROR
            ) {
              setMapsUnavailable(true);
            }
            setPredictions([]);
            setShowSuggestions(false);
          }
        },
      );
    }, 200);

    return () => clearTimeout(handle);
  }, [searchValue, isScriptReady, isInputFocused, mapsUnavailable]);

  const resolvePlaceDetails = (prediction: google.maps.places.AutocompletePrediction) => {
    if (!placesServiceRef.current) {
      onChange(prediction.description, "", "", "");
      return;
    }

    setIsLoading(true);
    placesServiceRef.current.getDetails(
      { 
        placeId: prediction.place_id, 
        fields: ["geometry", "formatted_address", "address_components", "name"] 
      },
      (details, status) => {
        setIsLoading(false);
        if (status === google.maps.places.PlacesServiceStatus.OK && details) {
          const { fullAddress, city, state, pincode } = extractAddressComponents(details);
          const lat = details.geometry?.location?.lat();
          const lng = details.geometry?.location?.lng();
          
          // Prevent the formatted address update from reopening suggestions
          skipNextFetchRef.current = true;
          setSearchValue(fullAddress);
          onChange(fullAddress, city, state, pincode, lat, lng);
        } else {
          if (status === google.maps.places.PlacesServiceStatus.REQUEST_DENIED) {
            setMapsUnavailable(true);
          }
          onChange(prediction.description, "", "", "");
        }
      },
    );
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setSearchValue(newValue);
    if (isInputFocused) {
      setShowSuggestions(true);
    }
  };

  const handleBlur = () => {
    setIsInputFocused(false);
    // If user typed manually (no Google selection), use the current search value as fullAddress
    if (searchValue.trim()) {
      onChange(searchValue.trim(), "", "", "");
    }
    setTimeout(() => setShowSuggestions(false), 150);
  };

  const handleSelectPrediction = (prediction: google.maps.places.AutocompletePrediction) => {
    // Prevent immediate refetch/reopen when searchValue changes programmatically
    skipNextFetchRef.current = true;

    setSearchValue(prediction.description);
    setShowSuggestions(false);
    setPredictions([]);
    setIsSearching(false);
    resolvePlaceDetails(prediction);
  };

  const canUseGooglePlaces = Boolean(googleMapsApiKey) && isScriptReady && !mapsUnavailable;

  return (
    <div className={cn("space-y-2", className)}>
      {label && (
        <label className="text-sm font-medium leading-none">
          {label}
        </label>
      )}

      <div className="relative flex-1">
        <div className="relative">
          <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            ref={inputRef}
            value={searchValue}
            onChange={handleInputChange}
            onBlur={handleBlur}
            onFocus={() => {
              setIsInputFocused(true);
              if (canUseGooglePlaces && searchValue.trim().length >= 2 && predictions.length > 0) {
                setShowSuggestions(true);
              }
            }}
            placeholder={placeholder}
            disabled={disabled || isLoading}
            className="pl-9 pr-10 "
            autoComplete="off"
          />
          {canUseGooglePlaces && (isLoading || isSearching) && (
            <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" />
          )}
        </div>

        {canUseGooglePlaces && showSuggestions && predictions.length > 0 && (
          <div
            className="absolute left-0 right-0 z-20 mt-1 overflow-auto rounded-md border bg-card text-card-foreground shadow-lg"
            style={{ maxHeight: "300px" }}
          >
            <ul className="divide-y">
              {predictions.map((prediction) => (
                <li
                  key={prediction.place_id}
                  className="cursor-pointer px-3 py-2 hover:bg-muted/60"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    handleSelectPrediction(prediction);
                  }}
                >
                  <div className="text-sm font-medium text-foreground">
                    {prediction.structured_formatting.main_text}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {prediction.structured_formatting.secondary_text ||
                      prediction.description}
                  </div>
                </li>
              ))}
            </ul>
            <div className="border-t px-3 py-1 text-right text-[10px] text-muted-foreground">
              powered by Google
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
