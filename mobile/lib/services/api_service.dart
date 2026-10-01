import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';

class ApiService {
  // Default to Android Emulator local loopback gateway
  String baseUrl = 'http://10.0.2.2:8000/api';

  static final ApiService _instance = ApiService._internal();
  factory ApiService() => _instance;
  ApiService._internal() {
    _loadConfig();
  }

  Future<void> _loadConfig() async {
    final prefs = await SharedPreferences.getInstance();
    baseUrl = prefs.getString('api_base_url') ?? 'http://10.0.2.2:8000/api';
  }

  Future<void> setBaseUrl(String url) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('api_base_url', url);
    baseUrl = url;
  }

  Future<String?> getToken() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString('auth_token');
  }

  Future<void> saveToken(String token) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('auth_token', token);
  }

  Future<void> clearToken() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove('auth_token');
    await prefs.remove('user_profile');
  }

  Future<Map<String, String>> _getHeaders() async {
    final token = await getToken();
    final headers = {
      'Content-Type': 'application/json',
    };
    if (token != null) {
      headers['Authorization'] = 'Bearer $token';
    }
    return headers;
  }

  // --- HEALTH CHECK ---
  Future<Map<String, dynamic>> checkHealth() async {
    try {
      final cleanBase = baseUrl.replaceAll('/api', '');
      final res = await http.get(Uri.parse('$cleanBase/health')).timeout(const Duration(seconds: 3));
      if (res.statusCode == 200) {
        return jsonDecode(res.body);
      }
    } catch (_) {}
    return {'status': 'offline', 'database': 'disconnected', 'model': 'unavailable'};
  }

  // --- AUTHENTICATION ---
  Future<Map<String, dynamic>> register(String name, String email, String password) async {
    final res = await http.post(
      Uri.parse('$baseUrl/auth/register'),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({
        'name': name,
        'email': email,
        'password': password,
        'role': 'Researcher'
      }),
    );
    final data = jsonDecode(res.body);
    if (res.statusCode != 200) {
      throw Exception(data['detail'] ?? 'Registration failed');
    }
    return data;
  }

  Future<Map<String, dynamic>> login(String email, String password) async {
    final res = await http.post(
      Uri.parse('$baseUrl/auth/login'),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({'email': email, 'password': password}),
    );
    final data = jsonDecode(res.body);
    if (res.statusCode != 200) {
      throw Exception(data['detail'] ?? 'Invalid email or password');
    }
    await saveToken(data['access_token']);
    
    // Fetch profile details
    final profile = await getProfile();
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('user_profile', jsonEncode(profile));
    
    return data;
  }

  Future<Map<String, dynamic>> getProfile() async {
    final headers = await _getHeaders();
    final res = await http.get(Uri.parse('$baseUrl/auth/me'), headers: headers);
    if (res.statusCode != 200) {
      throw Exception('Session expired');
    }
    return jsonDecode(res.body);
  }

  // --- DASHBOARD SUMMARY ---
  Future<Map<String, dynamic>> getDashboardSummary() async {
    final headers = await _getHeaders();
    final res = await http.get(Uri.parse('$baseUrl/dashboard/summary'), headers: headers);
    if (res.statusCode != 200) {
      throw Exception('Failed to load summary stats');
    }
    return jsonDecode(res.body);
  }

  // --- LIBRARIES ---
  Future<List<dynamic>> getDrugs() async {
    final headers = await _getHeaders();
    final res = await http.get(Uri.parse('$baseUrl/drugs'), headers: headers);
    if (res.statusCode != 200) {
      throw Exception('Failed to load drugs');
    }
    return jsonDecode(res.body);
  }

  Future<List<dynamic>> getPolymers() async {
    final headers = await _getHeaders();
    final res = await http.get(Uri.parse('$baseUrl/polymers'), headers: headers);
    if (res.statusCode != 200) {
      throw Exception('Failed to load polymers');
    }
    return jsonDecode(res.body);
  }

  // --- SIMULATIONS ---
  Future<Map<String, dynamic>> runSimulation(Map<String, dynamic> params) async {
    final headers = await _getHeaders();
    final res = await http.post(
      Uri.parse('$baseUrl/simulations/run'),
      headers: headers,
      body: jsonEncode(params),
    );
    final data = jsonDecode(res.body);
    if (res.statusCode != 200) {
      throw Exception(data['detail'] ?? 'Simulation calculation failed');
    }
    return data;
  }

  Future<List<dynamic>> getSimulationsHistory() async {
    final headers = await _getHeaders();
    final res = await http.get(Uri.parse('$baseUrl/simulations'), headers: headers);
    if (res.statusCode != 200) {
      throw Exception('Failed to load history registry');
    }
    return jsonDecode(res.body);
  }

  Future<void> deleteSimulation(String id) async {
    final headers = await _getHeaders();
    final res = await http.delete(Uri.parse('$baseUrl/simulations/$id'), headers: headers);
    if (res.statusCode != 200) {
      throw Exception('Failed to delete run');
    }
  }

  // --- REPORTS ---
  Future<List<dynamic>> getReports() async {
    final headers = await _getHeaders();
    final res = await http.get(Uri.parse('$baseUrl/reports'), headers: headers);
    if (res.statusCode != 200) {
      throw Exception('Failed to retrieve reports');
    }
    return jsonDecode(res.body);
  }

  Future<Map<String, dynamic>> generateReport(String simulationId) async {
    final headers = await _getHeaders();
    final res = await http.post(
      Uri.parse('$baseUrl/reports'),
      headers: headers,
      body: jsonEncode({'simulationId': simulationId}),
    );
    if (res.statusCode != 200) {
      throw Exception('Failed to generate report');
    }
    return jsonDecode(res.body);
  }

  Future<void> deleteReport(String id) async {
    final headers = await _getHeaders();
    final res = await http.delete(Uri.parse('$baseUrl/reports/$id'), headers: headers);
    if (res.statusCode != 200) {
      throw Exception('Failed to delete report');
    }
  }
}
