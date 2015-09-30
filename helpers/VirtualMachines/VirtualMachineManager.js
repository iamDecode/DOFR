var VirtualMachine = require("./VirtualMachine");

function VirtualMachineManager() {
    /**
     * Start a new virtual machine returns.
     */
    function startVM() {
        return new VirtualMachine();
    }
    function stopVM(virtualMachine) {
    }

}

module.exports = VirtualMachineManager;