"use client";

import React, { useEffect, useRef, useState } from "react";
import { LoadScript } from "@react-google-maps/api";
import { Input } from "@/components/ui/input";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

const libraries: ("places")[] = ["places"];

interface AddressAutocompleteProps {
    value: string;
    onChange: (address: string, city: string, state: string, pincode: string, lat?: number, lng?: number) => void;
    placeholder: string;
    label?: string;
    className?: string;
    disabled?: boolean;
}

export function AddressAutocomplete(props: AddressAutocompleteProps) {
    const googleMapsApiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "";
    const googlePlacesEnabled =
        process.env.NEXT_PUBLIC_ENABLE_GOOGLE_PLACES === "true" && Boolean(googleMapsApiKey);

    if (!googlePlacesEnabled) {
        return <ManualAddressAutocomplete {...props} />;
    }

    return <GoogleAddressAutocomplete {...props} />;
}

function ManualAddressAutocomplete({
    value,
    onChange,
    placeholder,
    label,
    className,
    disabled,
}: AddressAutocompleteProps) {
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
            <Input
                value={searchValue}
                onChange={handleInputChange}
                placeholder={placeholder}
                disabled={disabled}
                autoComplete="off"
            />
        </div>
    );
}

function GoogleAddressAutocomplete({
    value,
    onChange,
    placeholder,
    label,
    className,
    disabled,
}: AddressAutocompleteProps) {
    const [searchValue, setSearchValue] = useState(value);
    const [isLoading, setIsLoading] = useState(false);
    const [isSearching, setIsSearching] = useState(false);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [isScriptReady, setIsScriptReady] = useState(false);
    const [predictions, setPredictions] = useState<google.maps.places.AutocompletePrediction[]>([]);

    const inputRef = useRef<HTMLInputElement | null>(null);
    const autocompleteServiceRef = useRef<google.maps.places.AutocompleteService | null>(null);
    const placesServiceRef = useRef<google.maps.places.PlacesService | null>(null);

    // Keep local state in sync with external value
    useEffect(() => {
        setSearchValue(value);
    }, [value]);

    // Initialize Google services once script is loaded
    useEffect(() => {
        if (!isScriptReady || typeof window === "undefined" || !window.google) return;
        if (!autocompleteServiceRef.current) {
            autocompleteServiceRef.current = new google.maps.places.AutocompleteService();
        }
        if (!placesServiceRef.current) {
            placesServiceRef.current = new google.maps.places.PlacesService(document.createElement("div"));
        }
    }, [isScriptReady]);

    // Extract address components from place details
    const extractAddressComponents = (place: google.maps.places.PlaceResult) => {
        let address = "";
        let city = "";
        let state = "";
        let pincode = "";

        if (place.formatted_address) {
            address = place.formatted_address;
        }

        if (place.address_components) {
            for (const component of place.address_components) {
                const types = component.types;
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

        return { address, city, state, pincode };
    };

    // Fetch predictions as the user types
    useEffect(() => {
        if (!isScriptReady || !autocompleteServiceRef.current) return;
        if (searchValue.trim().length < 2) {
            setPredictions([]);
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
                        setPredictions([]);
                    }
                },
            );
        }, 200);

        return () => clearTimeout(handle);
    }, [searchValue, isScriptReady]);

    const resolvePlaceDetails = (prediction: google.maps.places.AutocompletePrediction) => {
        if (!placesServiceRef.current) {
            onChange(prediction.description, "", "", "");
            return;
        }

        setIsLoading(true);
        placesServiceRef.current.getDetails(
            { placeId: prediction.place_id, fields: ["geometry", "formatted_address", "address_components", "name"] },
            (details, status) => {
                setIsLoading(false);
                if (status === google.maps.places.PlacesServiceStatus.OK && details) {
                    const { address, city, state, pincode } = extractAddressComponents(details);
                    const lat = details.geometry?.location?.lat();
                    const lng = details.geometry?.location?.lng();
                    
                    setSearchValue(address);
                    onChange(address, city, state, pincode, lat, lng);
                } else {
                    onChange(prediction.description, "", "", "");
                }
            },
        );
    };

    // Handle manual input change
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newValue = e.target.value;
        setSearchValue(newValue);
        setShowSuggestions(true);
    };

    const handleBlur = () => {
        setTimeout(() => setShowSuggestions(false), 150);
    };

    const handleSelectPrediction = (prediction: google.maps.places.AutocompletePrediction) => {
        setSearchValue(prediction.description);
        setShowSuggestions(false);
        setPredictions([]);
        resolvePlaceDetails(prediction);
    };

    return (
        <LoadScript
            googleMapsApiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ""}
            libraries={libraries}
            onLoad={() => setIsScriptReady(true)}
        >
            <div className={cn("space-y-2", className)}>
                {label && (
                    <label className="text-sm font-medium leading-none">
                        {label}
                    </label>
                )}

                <div className="relative flex-1">
                    <Input
                        ref={inputRef}
                        value={searchValue}
                        onChange={handleInputChange}
                        onBlur={handleBlur}
                        onFocus={() => searchValue.trim().length >= 2 && predictions.length > 0 && setShowSuggestions(true)}
                        placeholder={placeholder}
                        disabled={disabled || isLoading}
                        className="pr-10"
                        autoComplete="off"
                    />
                    {(isLoading || isSearching) && (
                        <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" />
                    )}

                    {showSuggestions && predictions.length > 0 && (
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
        </LoadScript>
    );
}
