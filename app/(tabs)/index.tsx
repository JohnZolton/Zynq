import React, { useCallback, useEffect, useState, useRef } from "react";
import { Picker } from "@react-native-picker/picker";
import {
  StyleSheet,
  View,
  Button,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  FlatList,
  DrawerLayoutAndroid,
  Modal,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { debounce } from "lodash";
import Constants from "expo-constants";
import { ScrollView } from "react-native-gesture-handler";

const USDA_API_KEY = process.env.EXPO_PUBLIC_NUTRITION_DB_API_KEY;
interface FoodItem {
  fdcId: number;
  description: string;
  brandOwner?: string;
}

interface BrandedFoodItem {
  fdcId: number;
  availableDate?: string;
  brandOwner?: string;
  dataSource?: string;
  dataType: string;
  description: string;
  foodClass?: string;
  gtinUpc?: string;
  householdServingFullText?: string;
  ingredients?: string;
  modifiedDate?: string;
  publicationDate?: string;
  servingSize?: number;
  servingSizeUnit?: string;
  brandedFoodCategory?: string;
  foodNutrients: FoodNutrient[];
  foodUpdateLog?: FoodUpdateLog[];
  labelNutrients?: LabelNutrients;
}

interface FoodNutrient {
  id: number;
  amount: number;
  dataPoints?: number;
  min?: number;
  max?: number;
  median?: number;
  type?: string;
  nutrient: Nutrient;
  foodNutrientDerivation?: FoodNutrientDerivation;
  nutrientAnalysisDetails?: NutrientAnalysisDetails[];
}

interface Nutrient {
  id: number;
  number: string;
  name: string;
  rank?: number;
  unitName: string;
}

interface FoodNutrientDerivation {
  id: number;
  code: string;
  description: string;
  foodNutrientSource?: FoodNutrientSource;
}

interface FoodNutrientSource {
  id: number;
  code: string;
  description: string;
}

interface NutrientAnalysisDetails {
  subSampleId?: number;
  amount?: number;
  nutrientId?: number;
  labMethodDescription?: string;
  labMethodOriginalDescription?: string;
  labMethodLink?: string;
  labMethodTechnique?: string;
  nutrientAcquisitionDetails?: NutrientAcquisitionDetails[];
}

interface NutrientAcquisitionDetails {
  sampleUnitId?: number;
  purchaseDate?: string;
  storeCity?: string;
  storeState?: string;
}

interface FoodUpdateLog {
  fdcId: number;
  availableDate?: string;
  brandOwner?: string;
  dataSource?: string;
  dataType?: string;
  description?: string;
  foodClass?: string;
  gtinUpc?: string;
  householdServingFullText?: string;
  ingredients?: string;
  modifiedDate?: string;
  publicationDate?: string;
  servingSize?: number;
  servingSizeUnit?: string;
  brandedFoodCategory?: string;
  changes?: string;
  foodAttributes?: FoodAttribute[];
}

interface FoodAttribute {
  id: number;
  sequenceNumber?: number;
  value?: string;
  FoodAttributeType?: FoodAttributeType;
}

interface FoodAttributeType {
  id: number;
  name?: string;
  description?: string;
}

interface LabelNutrients {
  fat?: LabelNutrientValue;
  saturatedFat?: LabelNutrientValue;
  transFat?: LabelNutrientValue;
  cholesterol?: LabelNutrientValue;
  sodium?: LabelNutrientValue;
  carbohydrates?: LabelNutrientValue;
  fiber?: LabelNutrientValue;
  sugars?: LabelNutrientValue;
  protein?: LabelNutrientValue;
  calcium?: LabelNutrientValue;
  iron?: LabelNutrientValue;
  potassium?: LabelNutrientValue;
  calories?: LabelNutrientValue;
}

interface LabelNutrientValue {
  value: number;
}

interface LoggedFood {
  food: BrandedFoodItem;
  amount: number;
}

export default function IndexScreen() {
  const [searchQuery, setSearchQuery] = useState("");
  const [suggestions, setSuggestions] = useState<FoodItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedFood, setSelectedFood] = useState<BrandedFoodItem | null>(
    null
  );
  const [amount, setAmount] = useState<number>(0);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [loggedFoods, setLoggedFoods] = useState<LoggedFood[]>([]);
  const [searchModalOpen, setSearchModalOpen] = useState(false);
  let drawer = useRef<DrawerLayoutAndroid>(null);

  const router = useRouter();

  const fetchSuggestions = async (query: string) => {
    if (query.length < 3) {
      setSuggestions([]);
      return;
    }
    setIsLoading(true);
    try {
      const apiUrl = `https://api.nal.usda.gov/fdc/v1/foods/search?api_key=${USDA_API_KEY}&query=${encodeURIComponent(
        query
      )}&pageSize=20`;
      const response = await fetch(apiUrl, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Origin: "http://localhost:8081",
        },
      });
      const data = await response.json();
      console.log(data);
      setSuggestions(data.foods || []);
    } catch (error) {
      console.error(error);
      setSuggestions([]);
    } finally {
      setIsLoading(false);
    }
  };
  const debouncedFetchSuggestions = useCallback(
    debounce(fetchSuggestions, 300),
    []
  );
  useEffect(() => {
    debouncedFetchSuggestions(searchQuery);
  }, [searchQuery, debouncedFetchSuggestions]);
  const handleSearch = async (item: FoodItem) => {
    console.log("Searching for:", item);
    const apiUrl = `https://api.nal.usda.gov/fdc/v1/food/${encodeURIComponent(
      item.fdcId
    )}?api_key=${USDA_API_KEY}`;
    const response = await fetch(apiUrl, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Origin: "http://localhost:8081",
      },
    });
    const data = await response.json();
    console.log("setting: ", data);
    setSelectedFood(data);
    setIsModalVisible(true);
  };

  const genNumbers = () => {
    let numbers = [];
    for (let i = 1; i < 500; i++) {
      numbers.push(<Picker.Item key={i} label={i.toString()} value={i} />);
    }
    return numbers;
  };

  const handleSave = () => {
    if (selectedFood) {
      setLoggedFoods([...loggedFoods, { food: selectedFood, amount }]);
      setIsModalVisible(false);
      setSuggestions([]);
      setSearchQuery("");
      setAmount(1);
      setSearchModalOpen(false);
    }
  };

  return (
    <View>
      <View style={styles.container}>
        <Modal visible={searchModalOpen}>
          <View style={styles.searchContainer}>
            <TextInput
              style={styles.searchInput}
              placeholder="Search for a food item"
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoFocus={true}
            />
            {isLoading && <ActivityIndicator size="large" color="#0000ff" />}
            <FlatList
              data={suggestions}
              keyExtractor={(item) => item.fdcId.toString()}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.suggestionItem}
                  onPress={() => handleSearch(item)}
                >
                  <Text>{item.description}</Text>
                  {item.brandOwner && (
                    <Text style={styles.brandOwner}>{item.brandOwner}</Text>
                  )}
                </TouchableOpacity>
              )}
            ></FlatList>
          </View>
        </Modal>
        <View>
          {selectedFood && (
            <Modal visible={isModalVisible}>
              <ScrollView>
                <View>
                  <Text>{selectedFood.description}</Text>
                </View>
                <View>
                  {selectedFood.foodNutrients.map((item) => (
                    <Text key={item.id}>
                      {item.nutrient.name}:
                      {((item.amount * amount) / 100).toFixed(0)}
                    </Text>
                  ))}
                </View>
              </ScrollView>
              <View>
                <Picker
                  selectedValue={amount}
                  onValueChange={(value) => {
                    setAmount(value);
                  }}
                >
                  {genNumbers()}
                </Picker>
              </View>
              <Button title="Save" onPress={handleSave} />
            </Modal>
          )}
        </View>
        <View>
          <Text>Logged Foods</Text>
          <FlatList
            data={loggedFoods}
            keyExtractor={(item, index) => index.toString()}
            renderItem={({ item }) => (
              <View>
                <Text>{item.food.description}</Text>
                <Text>{item.amount}</Text>
              </View>
            )}
          />
        </View>
      </View>
      <View>
        <TouchableOpacity onPress={() => setSearchModalOpen(true)}>
          <Text>+</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ... styles remain the same
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  searchContainer: {
    padding: 20,
  },
  searchInput: {
    height: 40,
    borderColor: "gray",
    borderWidth: 1,
    borderRadius: 5,
    paddingHorizontal: 10,
    marginBottom: 10,
  },
  brandOwner: {
    fontSize: 12,
    color: "gray",
  },
  suggestionItem: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
});
