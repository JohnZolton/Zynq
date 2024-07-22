import React, { useCallback, useEffect, useState, useRef } from "react";
import * as SQLite from "expo-sqlite";
import { FontAwesome6 } from "@expo/vector-icons";
import { AntDesign } from "@expo/vector-icons";
import { Picker } from "@react-native-picker/picker";
import {
  StyleSheet,
  View,
  Button,
  Text,
  TextInput,
  ActivityIndicator,
  FlatList,
  DrawerLayoutAndroid,
  Modal,
  Pressable,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { debounce, times } from "lodash";
import Constants from "expo-constants";
import { ScrollView } from "react-native-gesture-handler";
import {
  SQLiteProvider,
  useSQLiteContext,
  type SQLiteDatabase,
} from "expo-sqlite";

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
  amount: number;
  date: string;
  time: string;
  description: string;
  brand: string;
  food_id: number;
  foodNutrients: string;
}
interface ParsedLoggedFood {
  amount: number;
  date: string;
  time: string;
  description: string;
  brand: string;
  food_id: number;
  foodNutrients: FoodNutrient[];
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
  const [loggedFoods, setLoggedFoods] = useState<ParsedLoggedFood[]>([]);
  const [searchModalOpen, setSearchModalOpen] = useState(false);

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
    setSearchModalOpen(false);
    setSuggestions([]);
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

  const handleSave = async () => {
    if (selectedFood) {
      const curDate = new Date();
      const dateString = curDate.toISOString().split("T")[0];
      const timeString = curDate.toTimeString().split(" ")[0];
      try {
        await addLoggedFood({
          date: dateString,
          time: timeString,
          amount: amount,
          food_id: selectedFood.fdcId,
          description: selectedFood.description,
          brand: selectedFood.brandOwner ?? "",
          foodNutrients: selectedFood.foodNutrients,
        });
        setLoggedFoods([
          ...loggedFoods,
          {
            amount,
            date: dateString,
            food_id: selectedFood.fdcId,
            description: selectedFood.description,
            brand: selectedFood.brandOwner ?? "",
            foodNutrients: selectedFood.foodNutrients,
            time: timeString,
          },
        ]);
        setIsModalVisible(false);
        setSuggestions([]);
        setSearchQuery("");
        setAmount(1);
        setSearchModalOpen(false);
      } catch (error) {
        console.error("error writing to db", error);
      }
    }
  };

  const fatId = 1004;
  const carbId = 1005;
  const proteinId = 1003;
  const calIds = [1008, 2047, 2048];
  const fiberId = 1079;

  const [currentDate, setCurrentDate] = useState(new Date());
  function handlePrevDate() {
    setCurrentDate(
      (prevDate) => new Date(prevDate.setDate(prevDate.getDate() - 1))
    );
  }
  function handleNextDate() {
    setCurrentDate(
      (prevDate) => new Date(prevDate.setDate(prevDate.getDate() + 1))
    );
  }
  const db = useSQLiteContext();
  useEffect(() => {
    console.log("DB thing going");
    async function setup() {
      const result = await db.getFirstAsync<{ "sqlite_version()": string }>(
        "SELECT sqlite_version()"
      );
    }
    setup();
    console.log("DB End");
  }, []);
  useEffect(() => {
    console.log("Changing Day");
    const dateString = currentDate.toISOString().split("T")[0];
    getLoggedFoodsByDate(dateString);
  }, [currentDate, setCurrentDate]);

  const addLoggedFood = async ({
    date,
    time,
    amount,
    description,
    brand,
    food_id,
    foodNutrients,
  }: {
    date: string;
    time: string;
    amount: number;
    description: string;
    brand: string;
    food_id: number;
    foodNutrients: FoodNutrient[];
  }) => {
    const result = await db.runAsync(
      "INSERT INTO logged_foods (date, time, amount, description, brand, food_id, food_data) VALUES (?, ?, ?, ?, ?, ?, ?)",
      [
        date,
        time,
        amount,
        description,
        brand,
        food_id,
        JSON.stringify(foodNutrients),
      ]
    );
    console.log("ADDED FOOD");
    console.log(result);
    console.log(date, time, amount, food_id, foodNutrients);
    return result;
  };

  const getLoggedFoodsByDate = async (date: string) => {
    console.log("selecting for: ", date);

    const result = await db.getAllAsync<LoggedFood>(
      "SELECT * FROM logged_foods WHERE DATE = ? ORDER BY time",
      [date]
    );
    console.log(result);

    const data = result.map((food): ParsedLoggedFood => {
      const parsedFoodData: FoodNutrient[] = JSON.parse(food.foodNutrients);

      return {
        ...food,
        foodNutrients: parsedFoodData,
      };
    });

    setLoggedFoods(data);
  };

  const deleteLoggedFood = async (id: number) => {
    await db.runAsync("DELETE FROM logged_foods WHERE id = ?", [id]);
  };

  const updateLoggedFoodAmount = async (id: number, newAmount: number) => {
    await db.runAsync("UPDATE logged_foods SET amount = ? WHERE id = ?", [
      newAmount,
      id,
    ]);
  };
  return (
    <View style={styles.container}>
      <View
        style={{
          flexDirection: "row",
          justifyContent: "center",
          paddingTop: 20,
        }}
      >
        <Pressable onPress={handlePrevDate}>
          <Ionicons name="arrow-back" size={24} color="black" />
        </Pressable>
        <Text style={{ marginHorizontal: 10 }}>
          {currentDate.toDateString()}
        </Text>
        <Pressable onPress={handleNextDate}>
          <Ionicons name="arrow-forward" size={24} color="black" />
        </Pressable>
      </View>
      <View>
        <Modal visible={searchModalOpen}>
          <View style={styles.searchContainer}>
            <View style={styles.arrowContainer}>
              <Pressable onPress={() => setSearchModalOpen(false)}>
                <AntDesign name="arrowleft" size={24} color="black" />
              </Pressable>
            </View>
            <View style={styles.inputContainer}>
              <FontAwesome6 name="magnifying-glass" size={20} color="black" />
              <TextInput
                style={styles.searchInput}
                placeholder="Search for a food"
                value={searchQuery}
                onChangeText={setSearchQuery}
                autoFocus={true}
              />
            </View>
          </View>
          {isLoading && <ActivityIndicator size="large" color="#0000ff" />}
          <FlatList
            data={suggestions}
            keyExtractor={(item, idx) => idx + item.fdcId.toString()}
            renderItem={({ item }) => (
              <Pressable
                style={styles.suggestionItem}
                onPress={() => handleSearch(item)}
              >
                <Text>{item.description}</Text>
                {item.brandOwner && (
                  <Text style={styles.brandOwner}>{item.brandOwner}</Text>
                )}
              </Pressable>
            )}
          ></FlatList>
        </Modal>
        <View>
          {selectedFood && (
            <Modal visible={isModalVisible}>
              <View style={styles.modalContent}>
                <Pressable
                  onPress={() => {
                    setSelectedFood(null);
                    setIsModalVisible(false);
                  }}
                >
                  <Ionicons name="arrow-back" size={24} />
                </Pressable>
                <Text style={styles.foodDescription}>
                  {selectedFood.description}
                </Text>
              </View>
              <View style={styles.pickerContainer}>
                <Text>Serving: </Text>
                <View style={styles.pickerInnerContainer}>
                  <TextInput
                    value={amount.toString()}
                    onChangeText={(text) => {
                      const newAmount = parseInt(text) || 0;
                      setAmount(newAmount);
                    }}
                    keyboardType="numeric"
                  />
                  <Text>(g)</Text>
                </View>
              </View>
              <FlatList
                style={{ flex: 1 }}
                contentContainerStyle={styles.nutrientsContainer}
                data={selectedFood.foodNutrients}
                keyExtractor={(item, index) =>
                  `${item.id?.toString()}-${index.toString()}`
                }
                renderItem={({ item }) => (
                  <Text style={styles.nutrientText}>
                    {item.nutrient.name}:
                    {((item.amount * amount) / 100).toFixed(0)}
                  </Text>
                )}
              />
              <Button title="Save" onPress={handleSave} />
            </Modal>
          )}
        </View>
        <View style={styles.loggedFoodsContainer}>
          <Text style={styles.loggedFoodsTitle}>Logged Foods</Text>
          <FlatList
            data={loggedFoods}
            keyExtractor={(item, index) => `${item.food_id}-${index}`}
            renderItem={({ item }) => {
              const calories = item.foodNutrients.find((food) =>
                calIds.includes(food.nutrient.id)
              );
              return (
                <View style={styles.loggedFoodItem}>
                  <View style={styles.loggedFoodHeader}>
                    <Text style={styles.loggedFoodItem}>
                      {item.description}
                    </Text>
                    <Text>
                      {(((calories?.amount ?? 0) * item.amount) / 100).toFixed(
                        0
                      )}{" "}
                      cals
                    </Text>
                  </View>
                  <View>
                    <Text>{item.amount} (g)</Text>
                  </View>
                </View>
              );
            }}
          />
        </View>
      </View>
      <Pressable
        style={styles.addButton}
        onPress={() => setSearchModalOpen(true)}
      >
        <AntDesign name="pluscircle" size={48} color="black" />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "white",
    padding: 20,
    height: "100%",
  },
  searchContainer: {
    paddingTop: 20,
    paddingBottom: 10,
    paddingHorizontal: 10,
    //backgroundColor: "red",
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
  },
  pickerStyle: {},
  arrowContainer: {
    justifyContent: "center",
    alignItems: "center",
    paddingBottom: 10,
  },
  inputContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    borderColor: "gray",
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 10,
    marginBottom: 10,
    marginLeft: 10,
  },
  icon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    height: 40,
    borderWidth: 0,
    paddingHorizontal: 5,
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
  modalContent: {
    padding: 20,
  },
  foodDescription: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
  },
  nutrientsContainer: {
    marginBottom: 20,
  },
  nutrientText: {
    fontSize: 16,
    marginBottom: 5,
  },
  pickerInnerContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  pickerContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
    width: "100%",
  },
  loggedFoodsContainer: {},
  loggedFoodsTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 10,
  },
  loggedFoodHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  loggedFoodItem: {
    padding: 10,
    backgroundColor: "#fff",
    borderRadius: 5,
    marginBottom: 10,
  },
  foodAmount: {
    fontSize: 16,
    color: "gray",
  },
  addButton: {
    position: "absolute",
    marginLeft: "50%",
    bottom: 10,
    transform: [{ translateX: -12 }],
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
  },
  addButtonText: {
    fontSize: 30,
    color: "#fff",
    lineHeight: 30,
  },
});
