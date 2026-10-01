import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../services/api_service.dart';

class NavDrawer extends StatefulWidget {
  final String currentRoute;
  const NavDrawer({Key? key, required this.currentRoute}) : super(key: key);

  @override
  State<NavDrawer> createState() => _NavDrawerState();
}

class _NavDrawerState extends State<NavDrawer> {
  final _api = ApiService();
  String _name = 'RESEARCHER';
  String _role = 'Principal Investigator';
  String _email = 'researcher@biopatch.ai';

  @override
  void initState() {
    super.initState();
    _loadProfile();
  }

  Future<void> _loadProfile() async {
    final prefs = await SharedPreferences.getInstance();
    final profileStr = prefs.getString('user_profile');
    if (profileStr != null) {
      try {
        final profile = jsonDecode(profileStr);
        setState(() {
          _name = profile['name'] ?? 'RESEARCHER';
          _role = profile['role'] ?? 'Researcher';
          _email = profile['email'] ?? '';
        });
      } catch (_) {}
    }
  }

  Widget _buildMenuItem(BuildContext context, IconData icon, String title, String route) {
    final isSelected = widget.currentRoute == route;
    return ListTile(
      leading: Icon(
        icon,
        color: isSelected ? const Color(0xFF0EA5E9) : Colors.grey[400],
      ),
      title: Text(
        title,
        style: TextStyle(
          color: isSelected ? Colors.white : Colors.grey[300],
          fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
          fontSize: 14,
        ),
      ),
      selected: isSelected,
      selectedTileColor: Colors.blue.withOpacity(0.08),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
      onTap: () {
        if (widget.currentRoute != route) {
          Navigator.pushReplacementNamed(context, route);
        } else {
          Navigator.pop(context);
        }
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    return Drawer(
      child: Container(
        color: const Color(0xFF0B0F19),
        child: Column(
          children: [
            // Drawer Header
            UserAccountsDrawerHeader(
              decoration: const BoxDecoration(
                color: Color(0xFF070913),
                border: Border(bottom: BorderSide(color: Color(0xFF1E293B))),
              ),
              currentAccountPicture: const CircleAvatar(
                backgroundColor: Color(0xFF0EA5E9),
                child: Icon(Icons.person, size: 40, color: Colors.white),
              ),
              accountName: Text(
                _name,
                style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
              ),
              accountEmail: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(_email, style: const TextStyle(fontSize: 12, color: Colors.grey)),
                  const SizedBox(height: 2),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                    decoration: BoxDecoration(
                      color: const Color(0xFF10B981).withOpacity(0.1),
                      borderRadius: BorderRadius.circular(4),
                    ),
                    child: Text(
                      _role.toUpperCase(),
                      style: const TextStyle(fontSize: 8, color: Color(0xFF10B981), fontWeight: FontWeight.bold),
                    ),
                  )
                ],
              ),
            ),
            
            // Drawer Scrollable Menu Items
            Expanded(
              child: ListView(
                padding: const EdgeInsets.symmetric(horizontal: 12.0),
                children: [
                  _buildMenuItem(context, Icons.dashboard_outlined, 'DASHBOARD CONSOLE', '/dashboard'),
                  _buildMenuItem(context, Icons.science_outlined, 'KINETICS SIMULATOR', '/simulator'),
                  _buildMenuItem(context, Icons.stream_outlined, 'RELEASE MONITOR', '/release-monitor'),
                  _buildMenuItem(context, Icons.psychology_outlined, 'AI PREDICTION MODULE', '/ai-prediction'),
                  _buildMenuItem(context, Icons.medication_outlined, 'DRUG DATABASE', '/drugs'),
                  _buildMenuItem(context, Icons.polymer_outlined, 'POLYMER REGISTRY', '/polymers'),
                  _buildMenuItem(context, Icons.history_outlined, 'SIMULATION HISTORY', '/history'),
                  _buildMenuItem(context, Icons.assignment_outlined, 'PRE-CLINICAL REPORTS', '/reports'),
                  _buildMenuItem(context, Icons.settings_outlined, 'SYSTEM SETTINGS', '/settings'),
                  const Divider(color: Color(0xFF1E293B)),
                  // Logout Button
                  ListTile(
                    leading: const Icon(Icons.logout_rounded, color: Colors.redAccent),
                    title: const Text(
                      'SIGN OUT SESSION',
                      style: TextStyle(color: Colors.redAccent, fontWeight: FontWeight.bold, fontSize: 13),
                    ),
                    onTap: () async {
                      await _api.clearToken();
                      if (context.mounted) {
                        Navigator.pushNamedAndRemoveUntil(context, '/', (route) => false);
                      }
                    },
                  ),
                ],
              ),
            ),
            
            // Footer academic version metadata
            const Padding(
              padding: EdgeInsets.all(16.0),
              child: Text(
                'BIOPATCH AI v1.0.0 (academic)',
                style: TextStyle(fontSize: 9, color: Colors.grey),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
