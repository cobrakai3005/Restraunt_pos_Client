"use client";

import React, { useEffect, useRef, useState } from "react";
import { useLoadScript } from "@react-google-maps/api";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2, Crosshair } from "lucide-react";
import { cn } from "@/lib/utils";

const libraries: ("places")[] = ["places"];

interface LocationPickerProps {
    value: string;
    onChange: (value: string, lat?: number, lng?: number) => void;
    placeholder: string;
    label?: string;
    height?: string;
    className?: string;
    disabled?: boolean;
}

export function LocationPicker(props: LocationPickerProps) {
    const googleMapsApiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "";
    const googlePlacesEnabled =
        process.env.NEXT_PUBLIC_ENABLE_GOOGLE_PLACES === "true" && Boolean(googleMapsApiKey);

    if (!googlePlacesEnabled) {
        return <ManualLocationPicker {...props} />;
    }

    return <GoogleLocationPicker {...props} />;
}

function ManualLocationPicker({
    value,
    onChange,
    placeholder,
    label,
    className,
    disabled,
}: LocationPickerProps) {
    const [searchValue, setSearchValue] = useState(value);

    useEffect(() => {
        setSearchValue(value);
    }, [value]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newValue = e.target.value;
        setSearchValue(newValue);
        onChange(newValue);
    };

    return (
        <div className={cn("space-y-2", className)}>
            {label && (
                <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
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

function GoogleLocationPicker({
    value,
    onChange,
    placeholder,
    label,
    height = "300px",
    className,
    disabled,
}: LocationPickerProps) {
    const [searchValue, setSearchValue] = useState(value);
    const [selectedLocation, setSelectedLocation] = useState<{
        lat: number;
        lng: number;
        address: string;
    } | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isSearching, setIsSearching] = useState(false);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [predictions, setPredictions] = useState<google.maps.places.AutocompletePrediction[]>([]);
    const [mapsUnavailable, setMapsUnavailable] = useState(false);
    const googleMapsApiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "";

    const { isLoaded: isScriptReady, loadError } = useLoadScript({
        id: "google-maps-script",
        googleMapsApiKey,
        libraries,
    });

    useEffect(() => {
        if (loadError) {
            setMapsUnavailable(true);
        }
    }, [loadError]);

    const inputRef = useRef<HTMLInputElement | null>(null);
    const autocompleteServiceRef = useRef<google.maps.places.AutocompleteService | null>(null);
    const placesServiceRef = useRef<google.maps.places.PlacesService | null>(null);

    // Keep local state in sync with external value (e.g., form reset)
    useEffect(() => {
        setSearchValue(value);
    }, [value]);

    // Initialize Google services once script is loaded
    useEffect(() => {
        if (!isScriptReady || mapsUnavailable || typeof window === "undefined" || !window.google) return;
        if (!autocompleteServiceRef.current) {
            autocompleteServiceRef.current = new google.maps.places.AutocompleteService();
        }
        if (!placesServiceRef.current) {
            placesServiceRef.current = new google.maps.places.PlacesService(document.createElement("div"));
        }
    }, [isScriptReady, mapsUnavailable]);

    // Fetch predictions as the user types
    useEffect(() => {
        if (mapsUnavailable || !isScriptReady || !autocompleteServiceRef.current) return;
        if (searchValue.trim().length < 2) {
            setPredictions([]);
            return;
        }

        setIsSearching(true);
        const handle = setTimeout(() => {
            autocompleteServiceRef.current?.getPlacePredictions(
                {
                    input: searchValue,
                    componentRestrictions: { country: ["in"] },
                },
                (res, status) => {
                    setIsSearching(false);
                    if (status === google.maps.places.PlacesServiceStatus.OK && Array.isArray(res)) {
                        setPredictions(res);
                    } else {
                        if (
                            status === google.maps.places.PlacesServiceStatus.REQUEST_DENIED ||
                            status === google.maps.places.PlacesServiceStatus.UNKNOWN_ERROR
                        ) {
                            setMapsUnavailable(true);
                        }
                        setPredictions([]);
                    }
                },
            );
        }, 200);

        return () => clearTimeout(handle);
    }, [searchValue, isScriptReady, mapsUnavailable]);

    const resolvePlaceDetails = (prediction: google.maps.places.AutocompletePrediction) => {
        if (!placesServiceRef.current) {
            onChange(prediction.description);
            return;
        }

        setIsLoading(true);
        placesServiceRef.current.getDetails(
            { placeId: prediction.place_id, fields: ["geometry", "formatted_address", "name"] },
            (details, status) => {
                setIsLoading(false);
                if (status === google.maps.places.PlacesServiceStatus.OK && details?.geometry?.location) {
                    const lat = details.geometry.location.lat();
                    const lng = details.geometry.location.lng();
                    const address = details.formatted_address || prediction.description;
                    setSelectedLocation({ lat, lng, address });
                    onChange(address, lat, lng);
                } else {
                    if (status === google.maps.places.PlacesServiceStatus.REQUEST_DENIED) {
                        setMapsUnavailable(true);
                    }
                    onChange(prediction.description);
                }
            },
        );
    };

    // Handle manual input change
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newValue = e.target.value;
        setSearchValue(newValue);
        setSelectedLocation(null);
        setShowSuggestions(true);
        onChange(newValue); // Update parent form even before a place is chosen
    };

    // Geocode free-text entry on blur if the user never chose a suggestion
    const handleBlur = () => {
        setTimeout(() => setShowSuggestions(false), 150); // allow click on list

        if (!mapsUnavailable && isScriptReady && searchValue && !selectedLocation?.address) {
            const geocoder = new google.maps.Geocoder();
            geocoder.geocode({ address: searchValue }, (results, status) => {
                if (status === "OK" && results && results[0]?.geometry?.location) {
                    const lat = results[0].geometry.location.lat();
                    const lng = results[0].geometry.location.lng();
                    const address = results[0].formatted_address;
                    setSelectedLocation({ lat, lng, address });
                    onChange(address, lat, lng);
                }
            });
        }
    };

    const handleSelectPrediction = (prediction: google.maps.places.AutocompletePrediction) => {
        setSearchValue(prediction.description);
        setShowSuggestions(false);
        setPredictions([]);
        resolvePlaceDetails(prediction);
    };

    const getCurrentLocation = () => {
        setIsLoading(true);
        if (mapsUnavailable || !isScriptReady) {
            setIsLoading(false);
            alert("Google Maps is unavailable. Please enter the address manually.");
            return;
        }
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const { latitude, longitude } = position.coords;
                    const geocoder = new google.maps.Geocoder();
                    geocoder.geocode(
                        { location: { lat: latitude, lng: longitude } },
                        (results, status) => {
                            setIsLoading(false);
                            if (status === "OK" && results && results[0]) {
                                const address = results[0].formatted_address;
                                setSelectedLocation({ lat: latitude, lng: longitude, address });
                                setSearchValue(address);
                                onChange(address, latitude, longitude);
                                if (inputRef.current) {
                                    inputRef.current.value = address;
                                }
                            }
                        },
                    );
                },
                (error) => {
                    setIsLoading(false);
                    console.error("Error getting location:", error);
                    alert("Unable to get your location. Please check your permissions.");
                },
            );
        } else {
            setIsLoading(false);
            alert("Geolocation is not supported by your browser.");
        }
    };

    const pickerUi = (
        <div className={cn("space-y-2", className)}>
            {label && (
                <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                    {label}
                </label>
            )}

            <div className="flex gap-2">
                <div className="relative flex-1">
                    <Input
                        ref={inputRef}
                        value={searchValue}
                        onChange={handleInputChange}
                        onBlur={handleBlur}
                        onFocus={() => setShowSuggestions(true)}
                        placeholder={placeholder}
                        disabled={disabled || isLoading}
                        className="pr-10"
                        autoComplete="off"
                    />
                    {!mapsUnavailable && (isLoading || isSearching) && (
                        <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" />
                    )}

                    {!mapsUnavailable && showSuggestions && predictions.length > 0 && (
                        <div
                            className="absolute left-0 right-0 z-20 mt-1 overflow-auto rounded-md border bg-card text-card-foreground shadow-lg"
                            style={{ maxHeight: height }}
                        >
                            <ul className="divide-y">
                                {predictions.map((prediction) => (
                                    <li
                                        key={prediction.place_id}
                                        className="cursor-pointer px-3 py-2 hover:bg-muted/60"
                                        onMouseDown={(e) => {
                                            e.preventDefault(); // keep focus for onBlur delay
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
                {/* <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={getCurrentLocation}
                    disabled={disabled || isLoading}
                    title="Use current location"
                >
                    <Crosshair className="h-4 w-4" />
                </Button> */}
            </div>
        </div>
    );

    return pickerUi;
}
